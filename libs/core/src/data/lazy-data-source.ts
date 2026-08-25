import { createBatchScanner, type BatchScanner } from './batch-scanner';
import { createRowStore, type IndexedDbRowStoreOptions } from './indexeddb-store';
import { LoadedRanges } from './loaded-ranges';
import { MemoryRowStore } from './memory-store';
import type {
  FetchRange,
  Range,
  RowStore,
  RowStoreKind,
  ScanBatch,
  SourceStats,
} from './types';

export interface BackgroundOptions {
  /** Rows per background batch. Defaults to the source's `batchSize`. */
  batchSize?: number;
  /** Batches in flight at once. Keep low so the viewport stays responsive. */
  concurrency?: number;
  /** Retries per failed batch before it is abandoned. */
  maxRetries?: number;
  /** Begin scanning as soon as the source is ready. Defaults to false. */
  autoStart?: boolean;
}

export interface LazyDataSourceOptions<T> {
  totalItems: number;
  fetchRange: FetchRange<T>;
  /** Spill rows to IndexedDB instead of the heap. Session-scoped. */
  useIndexedDb?: boolean | IndexedDbRowStoreOptions;
  /** Rows per batch for `scan()` and, by default, the background scanner. */
  batchSize?: number;
  background?: boolean | BackgroundOptions;
}

export type SourceEvent = 'rangeLoaded' | 'progress' | 'error';

export interface ScanOptions {
  startIndex?: number;
  endIndex?: number;
  batchSize?: number;
}

export interface LazyDataSource<T> {
  /** Resolves once the backing store is open. */
  ready(): Promise<void>;
  /** True once `dispose()` has run. The source is unusable afterwards. */
  isDisposed(): boolean;
  backendKind(): RowStoreKind;

  getItem(index: number): Promise<T | undefined>;
  getRange(startIndex: number, endIndex: number): Promise<Array<T | undefined>>;
  prefetch(startIndex: number, endIndex: number): Promise<void>;
  /** Streams the list in batches without ever holding all of it in memory. */
  scan(options?: ScanOptions): AsyncIterableIterator<ScanBatch<T>>;

  /** Synchronous read of the resident window — safe inside a render pass. */
  peek(startIndex: number, endIndex: number): Array<T | undefined>;
  has(index: number): boolean;

  /** Point the source at the visible range; fetches it and hydrates the window. */
  setViewport(startIndex: number, endIndex: number): Promise<void>;

  invalidate(startIndex?: number, endIndex?: number): Promise<void>;
  setTotalItems(totalItems: number): void;
  stats(): SourceStats;

  startBackground(): void;
  pauseBackground(): void;
  resumeBackground(): void;
  stopBackground(): void;
  whenBackgroundIdle(): Promise<void>;

  /** Change notification for framework bindings (`useSyncExternalStore`). */
  subscribe(listener: () => void): () => void;
  /** Monotonic counter, bumped on every change. Cheap to memoize on. */
  getVersion(): number;
  on(event: SourceEvent, listener: (payload: never) => void): () => void;

  dispose(): Promise<void>;
}

interface PendingFetch {
  range: Range;
  promise: Promise<void>;
}

/**
 * Owns a row cache and every path that fills it.
 *
 * The component only ever calls `setViewport` and `peek`; `getRange`/`scan` are
 * for everything that is not rendering — searching, exporting, aggregating. All
 * of them share one cache and one `fetchRange`, so a row pulled in by the
 * background scan is already there when it scrolls into view, and vice versa.
 */
export const createLazyDataSource = <T = unknown>(
  options: LazyDataSourceOptions<T>
): LazyDataSource<T> => {
  const { fetchRange, useIndexedDb = false, batchSize = 50 } = options;

  const backgroundOptions: BackgroundOptions =
    typeof options.background === 'object' ? options.background : {};
  const autoStartBackground =
    options.background === true || backgroundOptions.autoStart === true;

  let totalItems = options.totalItems;
  let store: RowStore<T> | null = null;
  let disposed = false;
  let version = 0;

  const loaded = new LoadedRanges();
  const inFlight = new LoadedRanges();
  /**
   * Ranges the background scan gave up on. They are in neither `loaded` nor
   * `inFlight`, so without this the scanner would be handed the same failing
   * batch forever and never reach the rows past it. Explicit reads still retry
   * them -- this only steers the unattended scan.
   */
  const abandoned = new LoadedRanges();
  let pending: PendingFetch[] = [];

  /**
   * Bumped by invalidate(). A fetch that was already in flight carries the
   * epoch it started in and drops its result if that has moved on, so stale
   * rows cannot land back in a cache the caller just cleared.
   */
  let epoch = 0;

  const changeListeners = new Set<() => void>();
  const eventListeners: Record<SourceEvent, Set<(payload: never) => void>> = {
    rangeLoaded: new Set(),
    progress: new Set(),
    error: new Set(),
  };

  const emit = (event: SourceEvent, payload: unknown) => {
    eventListeners[event].forEach((listener) =>
      (listener as (value: unknown) => void)(payload)
    );
  };

  const notifyChange = () => {
    version++;
    changeListeners.forEach((listener) => listener());
  };

  // The memory backend is built synchronously so `peek` works on first render;
  // IndexedDB has to open first, during which `peek` reports nothing resident.
  let readyPromise: Promise<void>;
  if (!useIndexedDb) {
    store = new MemoryRowStore<T>();
    readyPromise = Promise.resolve();
  } else {
    readyPromise = createRowStore<T>({ useIndexedDb }).then((created) => {
      if (disposed) {
        void created.dispose();
        return;
      }
      store = created;
    });
  }

  const clamp = (index: number) => Math.min(Math.max(index, 0), Math.max(totalItems - 1, 0));

  const runFetch = async (range: Range): Promise<void> => {
    const { startIndex, endIndex } = range;
    const expected = endIndex - startIndex + 1;
    const startedInEpoch = epoch;
    const rows = await fetchRange(startIndex, endIndex);

    if (!Array.isArray(rows) || rows.length !== expected) {
      throw new Error(
        `[lazy-virtual-scroll] fetchRange(${startIndex}, ${endIndex}) expected ${expected} rows but received ${
          Array.isArray(rows) ? rows.length : typeof rows
        }.`
      );
    }

    // Invalidated while this was in flight: the caller no longer wants these
    // rows, and writing them would silently resurrect what they just dropped.
    if (disposed || !store || startedInEpoch !== epoch) return;
    await store.set(startIndex, rows);
    if (disposed || startedInEpoch !== epoch) return;

    loaded.add(startIndex, endIndex);
    emit('rangeLoaded', range);
    notifyChange();
  };

  const startFetch = (range: Range): Promise<void> => {
    inFlight.add(range.startIndex, range.endIndex);
    const entry: PendingFetch = { range, promise: Promise.resolve() };
    entry.promise = runFetch(range).finally(() => {
      inFlight.remove(range.startIndex, range.endIndex);
      pending = pending.filter((p) => p !== entry);
    });
    pending.push(entry);
    return entry.promise;
  };

  /**
   * Splits the requested span into what must be fetched and what is already on
   * its way, so overlapping callers (viewport + search + background scan) share
   * one request instead of racing for the same rows.
   */
  const fetchMissing = async (startIndex: number, endIndex: number): Promise<void> => {
    const waitOn: Array<Promise<void>> = [];
    const toFetch: Range[] = [];

    for (const gap of loaded.missingWithin(startIndex, endIndex)) {
      let cursor = gap.startIndex;
      const overlapping = pending
        .filter((p) => p.range.startIndex <= gap.endIndex && p.range.endIndex >= gap.startIndex)
        .sort((a, b) => a.range.startIndex - b.range.startIndex);

      for (const p of overlapping) {
        if (p.range.startIndex > cursor) {
          toFetch.push({ startIndex: cursor, endIndex: p.range.startIndex - 1 });
        }
        waitOn.push(p.promise);
        cursor = Math.max(cursor, p.range.endIndex + 1);
        if (cursor > gap.endIndex) break;
      }

      if (cursor <= gap.endIndex) {
        toFetch.push({ startIndex: cursor, endIndex: gap.endIndex });
      }
    }

    await Promise.all([...waitOn, ...toFetch.map(startFetch)]);
  };

  /** First index claimed by neither the cache, an in-flight fetch, nor a failed batch. */
  const firstUnclaimed = (from: number, to: number): number | null => {
    let cursor = from;
    while (cursor <= to) {
      const missing = loaded.firstMissing(cursor, to);
      if (missing === null) return null;
      if (!inFlight.has(missing) && !abandoned.has(missing)) return missing;
      cursor = missing + 1;
    }
    return null;
  };

  const backgroundBatchSize = backgroundOptions.batchSize ?? batchSize;

  const scanner: BatchScanner = createBatchScanner({
    totalItems,
    batchSizeHint: backgroundBatchSize,
    concurrency: backgroundOptions.concurrency ?? 1,
    maxRetries: backgroundOptions.maxRetries ?? 1,
    nextRange: () => {
      if (disposed || totalItems <= 0) return null;
      const start = firstUnclaimed(0, totalItems - 1);
      if (start === null) return null;

      let end = Math.min(start + backgroundBatchSize - 1, totalItems - 1);
      for (let i = start + 1; i <= end; i++) {
        if (loaded.has(i) || inFlight.has(i) || abandoned.has(i)) {
          end = i - 1;
          break;
        }
      }
      return { startIndex: start, endIndex: end };
    },
    process: (range) => api.prefetch(range.startIndex, range.endIndex),
    onProgress: (progress) => emit('progress', progress),
    onError: (error, range) => {
      abandoned.add(range.startIndex, range.endIndex);
      emit('error', { error, range });
    },
  });

  const api: LazyDataSource<T> = {
    ready: () => readyPromise,

    isDisposed: () => disposed,

    backendKind: () => store?.kind ?? 'memory',

    async getItem(index) {
      const rows = await api.getRange(index, index);
      return rows[0];
    },

    async getRange(startIndex, endIndex) {
      await readyPromise;
      if (disposed || !store || totalItems <= 0) return [];

      const start = clamp(startIndex);
      const end = clamp(endIndex);
      if (end < start) return [];

      await fetchMissing(start, end);
      if (disposed || !store) return [];
      return store.getMany(start, end);
    },

    async prefetch(startIndex, endIndex) {
      await readyPromise;
      if (disposed || !store || totalItems <= 0) return;

      const start = clamp(startIndex);
      const end = clamp(endIndex);
      if (end < start) return;
      await fetchMissing(start, end);
    },

    async *scan(scanOptions: ScanOptions = {}) {
      await readyPromise;
      if (disposed || totalItems <= 0) return;

      const size = scanOptions.batchSize ?? batchSize;
      const last = clamp(scanOptions.endIndex ?? totalItems - 1);
      let cursor = clamp(scanOptions.startIndex ?? 0);

      while (cursor <= last && !disposed) {
        const end = Math.min(cursor + size - 1, last);
        const rows = await api.getRange(cursor, end);
        yield { startIndex: cursor, endIndex: end, rows };
        cursor = end + 1;
      }
    },

    peek(startIndex, endIndex) {
      const length = Math.max(0, endIndex - startIndex + 1);
      if (!store) return new Array(length).fill(undefined);
      return store.peek(startIndex, endIndex);
    },

    has: (index) => loaded.has(index),

    async setViewport(startIndex, endIndex) {
      await readyPromise;
      if (disposed || !store || totalItems <= 0) return;

      const start = clamp(startIndex);
      const end = clamp(endIndex);
      if (end < start) return;

      try {
        await fetchMissing(start, end);
      } catch (error) {
        // The component cannot handle this, and an unhandled rejection from a
        // scroll handler would be worse than a reported one.
        emit('error', { error, range: { startIndex: start, endIndex: end } });
      }
      if (disposed || !store) return;

      await store.setHotWindow(start, end);
      notifyChange();
    },

    async invalidate(startIndex, endIndex) {
      await readyPromise;
      if (disposed || !store) return;

      // Orphan every in-flight fetch before dropping anything, so none of them
      // can write back into the range we are about to clear.
      epoch++;

      if (startIndex === undefined || endIndex === undefined) {
        loaded.clear();
        abandoned.clear();
        await store.clear();
      } else {
        loaded.remove(startIndex, endIndex);
        abandoned.remove(startIndex, endIndex);
        await store.delete(startIndex, endIndex);
      }
      notifyChange();
    },

    setTotalItems(next) {
      totalItems = next;
      scanner.setTotalItems(next);
      notifyChange();
    },

    stats: () => ({
      loadedCount: loaded.count(),
      residentCount: store?.residentCount() ?? 0,
      totalItems,
      background: scanner.progress(),
    }),

    startBackground: () => scanner.start(),
    pauseBackground: () => scanner.pause(),
    resumeBackground: () => scanner.resume(),
    stopBackground: () => scanner.stop(),

    async whenBackgroundIdle() {
      await readyPromise;
      await scanner.whenIdle();
    },

    subscribe(listener) {
      changeListeners.add(listener);
      return () => changeListeners.delete(listener);
    },

    getVersion: () => version,

    on(event, listener) {
      eventListeners[event].add(listener);
      return () => eventListeners[event].delete(listener);
    },

    async dispose() {
      if (disposed) return;
      disposed = true;
      scanner.stop();
      loaded.clear();
      inFlight.clear();
      abandoned.clear();
      pending = [];
      changeListeners.clear();
      await store?.dispose();
      store = null;
    },
  };

  if (autoStartBackground) {
    void readyPromise.then(() => {
      if (!disposed) scanner.start();
    });
  }

  return api;
};
