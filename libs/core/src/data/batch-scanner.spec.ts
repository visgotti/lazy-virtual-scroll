import { createBatchScanner } from './batch-scanner';
import { LoadedRanges } from './loaded-ranges';
import type { Range } from './types';

const tick = (cb: () => void) => setTimeout(cb, 0);

/** Drives the scanner over a LoadedRanges, the way LazyDataSource does. */
const setup = (totalItems: number, opts: Partial<Parameters<typeof createBatchScanner>[0]> = {}) => {
  const loaded = new LoadedRanges();
  const processed: Range[] = [];
  const batchSize = (opts.batchSizeHint as number) ?? 4;

  const scanner = createBatchScanner({
    totalItems,
    batchSizeHint: batchSize,
    schedule: tick,
    nextRange: () => {
      const start = loaded.firstMissing(0, totalItems - 1);
      if (start === null) return null;
      const end = Math.min(start + batchSize - 1, totalItems - 1);
      // Claim immediately so concurrent workers never take the same batch.
      loaded.add(start, end);
      return { startIndex: start, endIndex: end };
    },
    process: async (range) => {
      processed.push(range);
    },
    ...opts,
  });

  return { scanner, processed, loaded };
};

describe('createBatchScanner', () => {
  it('starts idle and reports no progress', () => {
    const { scanner } = setup(10);
    expect(scanner.isRunning()).toBe(false);
    expect(scanner.progress()).toEqual({
      processedItems: 0,
      totalItems: 10,
      running: false,
      done: false,
    });
  });

  it('walks the whole index space in batches, clipping the final batch', async () => {
    const { scanner, processed } = setup(10, { batchSizeHint: 4 });
    scanner.start();
    await scanner.whenIdle();

    expect(processed).toEqual([
      { startIndex: 0, endIndex: 3 },
      { startIndex: 4, endIndex: 7 },
      { startIndex: 8, endIndex: 9 },
    ]);
  });

  it('reports done once the space is covered', async () => {
    const { scanner } = setup(10);
    scanner.start();
    await scanner.whenIdle();

    expect(scanner.progress()).toEqual({
      processedItems: 10,
      totalItems: 10,
      running: false,
      done: true,
    });
  });

  it('skips ranges another caller loaded first', async () => {
    const { scanner, processed, loaded } = setup(12, { batchSizeHint: 4 });
    // Pretend the viewport already pulled 4-7 while the scanner was idle.
    loaded.add(4, 7);
    scanner.start();
    await scanner.whenIdle();

    expect(processed).toEqual([
      { startIndex: 0, endIndex: 3 },
      { startIndex: 8, endIndex: 11 },
    ]);
  });

  it('never processes the same index twice under concurrency', async () => {
    const { scanner, processed } = setup(100, { batchSizeHint: 10, concurrency: 4 });
    scanner.start();
    await scanner.whenIdle();

    const seen = new Set<number>();
    for (const r of processed) {
      for (let i = r.startIndex; i <= r.endIndex; i++) {
        expect(seen.has(i)).toBe(false);
        seen.add(i);
      }
    }
    expect(seen.size).toBe(100);
  });

  it('stops handing out work while paused and continues after resume', async () => {
    const { scanner, processed } = setup(40, { batchSizeHint: 4 });
    scanner.start();
    scanner.pause();
    await new Promise((r) => setTimeout(r, 10));
    const whilePaused = processed.length;

    scanner.resume();
    await scanner.whenIdle();

    expect(whilePaused).toBeLessThan(10);
    expect(processed.length).toBe(10);
  });

  it('does not resume after being stopped', async () => {
    const { scanner, processed } = setup(40, { batchSizeHint: 4 });
    scanner.start();
    scanner.stop();
    await new Promise((r) => setTimeout(r, 10));
    const afterStop = processed.length;

    scanner.resume();
    await new Promise((r) => setTimeout(r, 10));

    expect(processed.length).toBe(afterStop);
    expect(scanner.isRunning()).toBe(false);
  });

  it('emits progress as batches complete', async () => {
    const seen: number[] = [];
    const { scanner } = setup(10, {
      batchSizeHint: 5,
      onProgress: (p) => seen.push(p.processedItems),
    });
    scanner.start();
    await scanner.whenIdle();

    expect(seen).toEqual([5, 10]);
  });

  it('reports a failing batch and keeps scanning the rest', async () => {
    const errors: Range[] = [];
    const loaded = new LoadedRanges();
    const processed: Range[] = [];
    const scanner = createBatchScanner({
      totalItems: 12,
      batchSizeHint: 4,
      schedule: tick,
      maxRetries: 0,
      nextRange: () => {
        const start = loaded.firstMissing(0, 11);
        if (start === null) return null;
        const end = Math.min(start + 3, 11);
        loaded.add(start, end);
        return { startIndex: start, endIndex: end };
      },
      process: async (range) => {
        if (range.startIndex === 4) throw new Error('boom');
        processed.push(range);
      },
      onError: (_err, range) => errors.push(range),
    });

    scanner.start();
    await scanner.whenIdle();

    expect(errors).toEqual([{ startIndex: 4, endIndex: 7 }]);
    expect(processed).toEqual([
      { startIndex: 0, endIndex: 3 },
      { startIndex: 8, endIndex: 11 },
    ]);
  });

  it('retries a failing batch up to maxRetries before giving up', async () => {
    let attempts = 0;
    const loaded = new LoadedRanges();
    const scanner = createBatchScanner({
      totalItems: 4,
      batchSizeHint: 4,
      schedule: tick,
      maxRetries: 2,
      nextRange: () => {
        const start = loaded.firstMissing(0, 3);
        if (start === null) return null;
        loaded.add(start, 3);
        return { startIndex: start, endIndex: 3 };
      },
      process: async () => {
        attempts++;
        throw new Error('boom');
      },
    });

    scanner.start();
    await scanner.whenIdle();

    expect(attempts).toBe(3);
  });

  it('resolves whenIdle immediately if it was never started', async () => {
    const { scanner } = setup(10);
    await expect(scanner.whenIdle()).resolves.toBeUndefined();
  });

  it('treats a zero-length list as already done', async () => {
    const { scanner, processed } = setup(0);
    scanner.start();
    await scanner.whenIdle();
    expect(processed).toEqual([]);
    expect(scanner.progress().done).toBe(true);
  });
});

describe('createBatchScanner lifecycle edge cases', () => {
  it('recovers cleanly when started again after a mid-batch stop', async () => {
    // The batch already in flight when stop() lands cannot be aborted, so a
    // brief overlap is expected. What must not happen is the orphaned worker
    // rejoining the new run and driving the active count below zero, which
    // leaves whenIdle() permanently unresolved.
    const processed: Range[] = [];
    const loaded = new LoadedRanges();
    const scanner = createBatchScanner({
      totalItems: 100,
      batchSizeHint: 10,
      concurrency: 1,
      schedule: tick,
      nextRange: () => {
        const start = loaded.firstMissing(0, 99);
        if (start === null) return null;
        const end = Math.min(start + 9, 99);
        loaded.add(start, end);
        return { startIndex: start, endIndex: end };
      },
      process: async (range) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        processed.push(range);
      },
    });

    scanner.start();
    await new Promise((resolve) => setTimeout(resolve, 8)); // stop mid-batch
    scanner.stop();
    scanner.start();
    await scanner.whenIdle();

    expect(scanner.isRunning()).toBe(false);
    expect(scanner.progress().done).toBe(true);

    const seen = new Set<number>();
    for (const r of processed) {
      for (let i = r.startIndex; i <= r.endIndex; i++) seen.add(i);
    }
    expect(seen.size).toBe(100);
  });

  it('scans the new rows when totalItems grows after the scan finished', async () => {
    let total = 10;
    const loaded = new LoadedRanges();
    const processed: Range[] = [];
    const scanner = createBatchScanner({
      totalItems: total,
      batchSizeHint: 5,
      schedule: tick,
      nextRange: () => {
        const start = loaded.firstMissing(0, total - 1);
        if (start === null) return null;
        const end = Math.min(start + 4, total - 1);
        loaded.add(start, end);
        return { startIndex: start, endIndex: end };
      },
      process: async (range) => {
        processed.push(range);
      },
    });

    scanner.start();
    await scanner.whenIdle();
    expect(processed).toHaveLength(2);

    total = 20;
    scanner.setTotalItems(20);
    await scanner.whenIdle();

    expect(processed).toEqual([
      { startIndex: 0, endIndex: 4 },
      { startIndex: 5, endIndex: 9 },
      { startIndex: 10, endIndex: 14 },
      { startIndex: 15, endIndex: 19 },
    ]);
    expect(scanner.progress().done).toBe(true);
  });
});
