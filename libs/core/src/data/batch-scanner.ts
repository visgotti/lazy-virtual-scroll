import type { Range, ScanProgress } from './types';

export interface BatchScannerOptions {
  totalItems: number;
  concurrency?: number;
  /** Attempts after the first before a batch is abandoned. */
  maxRetries?: number;
  /**
   * Advisory only — batch sizing lives in `nextRange`, which is what actually
   * decides how much work each step claims.
   */
  batchSizeHint?: number;
  /** Next chunk of work, or null when the space is exhausted. */
  nextRange: () => Range | null;
  process: (range: Range) => Promise<void>;
  /** Defer to the next idle slot. Injectable so tests need no fake clock. */
  schedule?: (cb: () => void) => void;
  onProgress?: (progress: ScanProgress) => void;
  onError?: (error: unknown, range: Range) => void;
}

export interface BatchScanner {
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  isRunning(): boolean;
  progress(): ScanProgress;
  /** Resolves when the scan finishes or is stopped. */
  whenIdle(): Promise<void>;
  setTotalItems(totalItems: number): void;
}

/**
 * Yields to the browser between batches rather than looping greedily.
 *
 * `requestIdleCallback` is the whole reason a background scan can run during
 * scrolling without competing with the scroll handler; the timeout keeps it
 * from starving on a permanently busy page, and the setTimeout branch covers
 * Safari and non-browser hosts.
 */
const defaultSchedule = (cb: () => void): void => {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => cb(), { timeout: 200 });
    return;
  }
  setTimeout(cb, 0);
};

/**
 * Walks an index space in batches off the critical path.
 *
 * It does not know about stores or fetching: it is handed `nextRange` and
 * `process` and only owns pacing, concurrency, pausing and retries. Ranges the
 * viewport already claimed simply never come back from `nextRange`, which is
 * how viewport work implicitly preempts the scan.
 */
export const createBatchScanner = (options: BatchScannerOptions): BatchScanner => {
  const {
    concurrency = 1,
    maxRetries = 1,
    nextRange,
    process,
    schedule = defaultSchedule,
    onProgress,
    onError,
  } = options;

  let totalItems = options.totalItems;
  let running = false;
  let paused = false;
  /** User intent: start() was called and stop() has not undone it. */
  let started = false;
  let exhausted = false;
  let processedItems = 0;
  let activeWorkers = 0;

  /**
   * Bumped by every start() and stop(). Workers carry the generation they were
   * spawned in and retire silently when it moves on, so a worker still awaiting
   * its batch when the scan is stopped can never rejoin a later run or
   * decrement a counter that no longer belongs to it.
   */
  let generation = 0;

  let idleResolvers: Array<() => void> = [];

  const progress = (): ScanProgress => ({
    processedItems,
    totalItems,
    running,
    done: exhausted,
  });

  const settleIdle = () => {
    running = false;
    const resolvers = idleResolvers;
    idleResolvers = [];
    resolvers.forEach((resolve) => resolve());
  };

  const runBatch = async (range: Range): Promise<void> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await process(range);
        processedItems += range.endIndex - range.startIndex + 1;
        onProgress?.(progress());
        return;
      } catch (error) {
        if (attempt === maxRetries) {
          onError?.(error, range);
          return;
        }
      }
    }
  };

  const worker = (gen: number): void => {
    // Orphaned by a stop() or a restart: retire without touching shared state.
    if (gen !== generation) return;

    if (paused) {
      // Park rather than exit, so whenIdle() cannot resolve mid-pause.
      schedule(() => worker(gen));
      return;
    }

    const range = nextRange();
    if (range === null) {
      exhausted = true;
      if (--activeWorkers === 0) settleIdle();
      return;
    }

    runBatch(range).then(() => {
      if (gen !== generation) return;
      schedule(() => worker(gen));
    });
  };

  const spawnWorkers = (): void => {
    generation++;
    running = true;
    activeWorkers = Math.max(1, concurrency);
    const gen = generation;
    for (let i = 0; i < activeWorkers; i++) schedule(() => worker(gen));
  };

  return {
    start() {
      if (running) return;
      started = true;
      paused = false;
      exhausted = false;
      spawnWorkers();
    },

    pause() {
      paused = true;
    },

    resume() {
      if (!started) return;
      paused = false;
    },

    stop() {
      // Bumping the generation orphans every live worker, so none of them will
      // decrement activeWorkers afterwards -- settle the waiters here instead.
      generation++;
      started = false;
      paused = false;
      activeWorkers = 0;
      if (running) settleIdle();
    },

    isRunning() {
      return running;
    },

    progress,

    whenIdle() {
      if (!running) return Promise.resolve();
      return new Promise<void>((resolve) => idleResolvers.push(resolve));
    },

    setTotalItems(next: number) {
      const grew = next > totalItems;
      totalItems = next;
      // A finished scan has new ground to cover, but no worker left alive to
      // notice -- relaunch rather than leaving progress stuck at not-done.
      if (!grew || !started || running) return;
      exhausted = false;
      spawnWorkers();
    },
  };
};
