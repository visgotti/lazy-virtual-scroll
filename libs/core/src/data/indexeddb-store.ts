import { LoadedRanges } from './loaded-ranges';
import { MemoryRowStore } from './memory-store';
import type { RowStore, RowStoreKind } from './types';

const DEFAULT_STORE_NAME = 'rows';

const promisify = <R>(request: IDBRequest<R>): Promise<R> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export interface IndexedDbRowStoreOptions {
  dbName?: string;
  storeName?: string;
}

let instanceCounter = 0;

/**
 * Spills rows to IndexedDB so a full background scan does not pin the whole
 * list on the heap. Only the hot window — the visible range plus buffer — stays
 * in memory; everything else is reachable only through the async API.
 *
 * Session-scoped by design: the database is wiped on open and deleted on
 * dispose. It is a cache that happens to live outside the heap, not a
 * persistence layer, so there is no version key, no TTL and no staleness
 * contract for consumers to get wrong.
 */
export class IndexedDbRowStore<T = unknown> implements RowStore<T> {
  readonly kind: RowStoreKind = 'indexeddb';

  private readonly dbName: string;
  private readonly storeName: string;

  private db: IDBDatabase | null = null;
  private openPromise: Promise<void> | null = null;
  private disposed = false;

  private loaded = new LoadedRanges();
  private hot = new Map<number, T>();
  private hotStart = 0;
  private hotEnd = -1;

  constructor(options: IndexedDbRowStoreOptions = {}) {
    this.dbName = options.dbName ?? `lvs-rows-${Date.now()}-${instanceCounter++}`;
    this.storeName = options.storeName ?? DEFAULT_STORE_NAME;
  }

  /** Opens (and wipes) the backing database. Safe to call repeatedly. */
  ready(): Promise<void> {
    if (!this.openPromise) {
      this.openPromise = this.open();
    }
    return this.openPromise;
  }

  private async open(): Promise<void> {
    // Wipe first: a database left behind by a previous session must never leak
    // stale rows into this one.
    await this.deleteDatabase();

    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error(`IndexedDB open blocked: ${this.dbName}`));
    });
  }

  private deleteDatabase(): Promise<void> {
    return new Promise((resolve) => {
      const request = indexedDB.deleteDatabase(this.dbName);
      // A blocked or failed delete is not fatal — resolve and let open() decide.
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });
  }

  private async withStore<R>(
    mode: IDBTransactionMode,
    work: (store: IDBObjectStore) => Promise<R>
  ): Promise<R | undefined> {
    if (this.disposed) return undefined;
    await this.ready();
    if (this.disposed || !this.db) return undefined;

    const transaction = this.db.transaction(this.storeName, mode);
    const result = await work(transaction.objectStore(this.storeName));

    if (mode === 'readwrite') {
      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
    }
    return result;
  }

  async get(index: number): Promise<T | undefined> {
    if (this.hot.has(index)) return this.hot.get(index);
    if (!this.loaded.has(index)) return undefined;
    return this.withStore('readonly', (store) =>
      promisify<T | undefined>(store.get(index) as IDBRequest<T | undefined>)
    );
  }

  async getMany(startIndex: number, endIndex: number): Promise<Array<T | undefined>> {
    const length = Math.max(0, endIndex - startIndex + 1);
    const out: Array<T | undefined> = new Array(length).fill(undefined);
    if (!length) return out;

    const fromDb = await this.readRange(startIndex, endIndex);
    for (const [index, value] of fromDb) {
      out[index - startIndex] = value;
    }
    // The hot window is authoritative: it may hold writes not yet flushed.
    for (let i = startIndex; i <= endIndex; i++) {
      if (this.hot.has(i)) out[i - startIndex] = this.hot.get(i);
    }
    return out;
  }

  private async readRange(startIndex: number, endIndex: number): Promise<Map<number, T>> {
    const found = new Map<number, T>();
    await this.withStore('readonly', async (store) => {
      const range = IDBKeyRange.bound(startIndex, endIndex);
      await new Promise<void>((resolve, reject) => {
        const request = store.openCursor(range);
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) {
            resolve();
            return;
          }
          found.set(cursor.key as number, cursor.value as T);
          cursor.continue();
        };
        request.onerror = () => reject(request.error);
      });
    });
    return found;
  }

  async set(startingIndex: number, rows: T[]): Promise<void> {
    if (!rows.length || this.disposed) return;

    // One transaction per batch, not per row.
    await this.withStore('readwrite', async (store) => {
      for (let i = 0; i < rows.length; i++) {
        store.put(rows[i], startingIndex + i);
      }
    });
    if (this.disposed) return;

    this.loaded.add(startingIndex, startingIndex + rows.length - 1);
    for (let i = 0; i < rows.length; i++) {
      const index = startingIndex + i;
      if (index >= this.hotStart && index <= this.hotEnd) {
        this.hot.set(index, rows[i]);
      }
    }
  }

  async clear(): Promise<void> {
    this.loaded.clear();
    this.hot.clear();
    await this.withStore('readwrite', async (store) => {
      store.clear();
    });
  }

  async delete(startIndex: number, endIndex: number): Promise<void> {
    this.loaded.remove(startIndex, endIndex);
    for (let i = startIndex; i <= endIndex; i++) this.hot.delete(i);
    await this.withStore('readwrite', async (store) => {
      store.delete(IDBKeyRange.bound(startIndex, endIndex));
    });
  }

  has(index: number): boolean {
    return this.loaded.has(index);
  }

  peek(startIndex: number, endIndex: number): Array<T | undefined> {
    const out: Array<T | undefined> = new Array(Math.max(0, endIndex - startIndex + 1));
    for (let i = 0; i < out.length; i++) {
      out[i] = this.hot.get(startIndex + i);
    }
    return out;
  }

  async setHotWindow(startIndex: number, endIndex: number): Promise<void> {
    if (this.disposed) return;
    this.hotStart = startIndex;
    this.hotEnd = endIndex;

    // Evict first so memory stays bounded even if hydration is slow.
    for (const index of this.hot.keys()) {
      if (index < startIndex || index > endIndex) this.hot.delete(index);
    }
    if (endIndex < startIndex) return;

    const rows = await this.readRange(startIndex, endIndex);
    if (this.disposed) return;
    // A newer window may have landed while we were reading; only keep what fits.
    for (const [index, value] of rows) {
      if (index >= this.hotStart && index <= this.hotEnd) this.hot.set(index, value);
    }
  }

  loadedCount(): number {
    return this.loaded.count();
  }

  residentCount(): number {
    return this.hot.size;
  }

  /** Closes the connection without deleting the database. */
  async close(): Promise<void> {
    this.db?.close();
    this.db = null;
    this.openPromise = null;
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    this.loaded.clear();
    this.hot.clear();
    this.db?.close();
    this.db = null;
    await this.deleteDatabase();
  }
}

export interface CreateRowStoreOptions {
  useIndexedDb?: boolean | IndexedDbRowStoreOptions;
}

let warnedUnavailable = false;

/**
 * Picks a backend, falling back to memory when IndexedDB is unusable — missing
 * under SSR, and known to throw on `open` in Safari private browsing.
 *
 * Nothing downstream has to care which one it got: that is the whole point of
 * keeping the `RowStore` interface async on both sides.
 */
export const createRowStore = async <T = unknown>(
  options: CreateRowStoreOptions = {}
): Promise<RowStore<T>> => {
  const { useIndexedDb } = options;
  if (!useIndexedDb) return new MemoryRowStore<T>();

  if (typeof indexedDB === 'undefined') {
    if (!warnedUnavailable) {
      warnedUnavailable = true;
      console.warn(
        '[lazy-virtual-scroll] useIndexedDb was requested but IndexedDB is unavailable; falling back to in-memory storage.'
      );
    }
    return new MemoryRowStore<T>();
  }

  const store = new IndexedDbRowStore<T>(
    typeof useIndexedDb === 'object' ? useIndexedDb : {}
  );
  try {
    await store.ready();
    return store;
  } catch (error) {
    console.warn(
      '[lazy-virtual-scroll] IndexedDB could not be opened; falling back to in-memory storage.',
      error
    );
    await store.dispose().catch(() => undefined);
    return new MemoryRowStore<T>();
  }
};
