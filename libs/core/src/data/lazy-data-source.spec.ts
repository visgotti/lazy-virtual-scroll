import 'fake-indexeddb/auto';
import { createLazyDataSource } from './lazy-data-source';

const rows = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => `row-${start + i}`);

let dbCounter = 0;

/**
 * Every behavioural test runs against both backends. If IndexedDB ever diverges
 * from memory in anything a consumer can observe, this suite goes red.
 */
describe.each([
  ['memory', () => ({ useIndexedDb: false as const })],
  ['indexeddb', () => ({ useIndexedDb: { dbName: `lvs-src-${dbCounter++}` } })],
])('createLazyDataSource (%s backend)', (_label, backend) => {
  const makeSource = (over: Record<string, unknown> = {}) => {
    const calls: Array<[number, number]> = [];
    const source = createLazyDataSource<string>({
      totalItems: 20,
      fetchRange: async (startIndex, endIndex) => {
        calls.push([startIndex, endIndex]);
        return rows(startIndex, endIndex);
      },
      ...backend(),
      ...over,
    });
    return { source, calls };
  };

  it('fetches a requested range and returns it in index order', async () => {
    const { source } = makeSource();
    expect(await source.getRange(2, 5)).toEqual(['row-2', 'row-3', 'row-4', 'row-5']);
    await source.dispose();
  });

  it('serves a single item', async () => {
    const { source } = makeSource();
    expect(await source.getItem(7)).toBe('row-7');
    await source.dispose();
  });

  it('does not refetch a range it already holds', async () => {
    const { source, calls } = makeSource();
    await source.getRange(0, 4);
    await source.getRange(0, 4);
    expect(calls).toEqual([[0, 4]]);
    await source.dispose();
  });

  it('fetches only the missing part of a partially held range', async () => {
    const { source, calls } = makeSource();
    await source.getRange(0, 4);
    await source.getRange(3, 8);
    expect(calls).toEqual([
      [0, 4],
      [5, 8],
    ]);
    await source.dispose();
  });

  it('fetches each interior gap separately rather than refetching the span', async () => {
    const { source, calls } = makeSource();
    await source.getRange(0, 2);
    await source.getRange(6, 8);
    calls.length = 0;
    await source.getRange(0, 8);
    expect(calls).toEqual([
      [3, 5],
    ]);
    await source.dispose();
  });

  it('dedupes concurrent requests for the same range into one fetch', async () => {
    const { source, calls } = makeSource();
    await Promise.all([source.getRange(0, 4), source.getRange(0, 4), source.getRange(0, 4)]);
    expect(calls).toEqual([[0, 4]]);
    await source.dispose();
  });

  it('clamps requests to the bounds of the list', async () => {
    const { source, calls } = makeSource();
    await source.getRange(-5, 25);
    expect(calls).toEqual([[0, 19]]);
    await source.dispose();
  });

  it('reports loaded count as ranges arrive', async () => {
    const { source } = makeSource();
    expect(source.stats().loadedCount).toBe(0);
    await source.getRange(0, 4);
    expect(source.stats().loadedCount).toBe(5);
    await source.dispose();
  });

  it('answers membership synchronously', async () => {
    const { source } = makeSource();
    await source.getRange(0, 4);
    expect(source.has(4)).toBe(true);
    expect(source.has(5)).toBe(false);
    await source.dispose();
  });

  it('serves the viewport synchronously through peek once loaded', async () => {
    const { source } = makeSource();
    await source.setViewport(0, 3);
    expect(source.peek(0, 3)).toEqual(['row-0', 'row-1', 'row-2', 'row-3']);
    await source.dispose();
  });

  it('returns placeholder-shaped output from peek before the viewport resolves', async () => {
    const { source } = makeSource();
    expect(source.peek(0, 3)).toEqual([undefined, undefined, undefined, undefined]);
    await source.dispose();
  });

  it('notifies subscribers when a range lands', async () => {
    const { source } = makeSource();
    let notifications = 0;
    const unsubscribe = source.subscribe(() => notifications++);

    await source.getRange(0, 4);
    expect(notifications).toBeGreaterThan(0);

    const settled = notifications;
    unsubscribe();
    await source.getRange(5, 9);
    expect(notifications).toBe(settled);
    await source.dispose();
  });

  it('bumps a version on every change so bindings can memoize on it', async () => {
    const { source } = makeSource();
    const before = source.getVersion();
    await source.getRange(0, 4);
    expect(source.getVersion()).toBeGreaterThan(before);
    await source.dispose();
  });

  it('streams every row through scan in batches', async () => {
    const { source } = makeSource({ totalItems: 10, batchSize: 4 });
    const seen: string[] = [];
    const batchSizes: number[] = [];

    for await (const batch of source.scan()) {
      batchSizes.push(batch.rows.length);
      seen.push(...(batch.rows as string[]));
    }

    expect(batchSizes).toEqual([4, 4, 2]);
    expect(seen).toEqual(rows(0, 9));
    await source.dispose();
  });

  it('scans a bounded sub-range when asked', async () => {
    const { source } = makeSource({ totalItems: 10, batchSize: 4 });
    const seen: string[] = [];
    for await (const batch of source.scan({ startIndex: 2, endIndex: 5 })) {
      seen.push(...(batch.rows as string[]));
    }
    expect(seen).toEqual(rows(2, 5));
    await source.dispose();
  });

  it('reuses cached rows during a scan instead of refetching them', async () => {
    const { source, calls } = makeSource({ totalItems: 8, batchSize: 4 });
    await source.getRange(0, 3);
    calls.length = 0;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _batch of source.scan()) { /* drain */ }

    expect(calls).toEqual([[4, 7]]);
    await source.dispose();
  });

  it('surfaces a fetch failure to the caller without caching the range', async () => {
    let attempts = 0;
    const source = createLazyDataSource<string>({
      totalItems: 10,
      ...backend(),
      fetchRange: async (startIndex, endIndex) => {
        attempts++;
        if (attempts === 1) throw new Error('network down');
        return rows(startIndex, endIndex);
      },
    });

    await expect(source.getRange(0, 3)).rejects.toThrow('network down');
    expect(source.stats().loadedCount).toBe(0);

    expect(await source.getRange(0, 3)).toEqual(rows(0, 3));
    await source.dispose();
  });

  it('refetches a range after it is invalidated', async () => {
    const { source, calls } = makeSource();
    await source.getRange(0, 4);
    await source.invalidate(0, 4);
    expect(source.has(0)).toBe(false);
    await source.getRange(0, 4);
    expect(calls).toEqual([
      [0, 4],
      [0, 4],
    ]);
    await source.dispose();
  });

  it('drops everything when invalidated with no range', async () => {
    const { source } = makeSource();
    await source.getRange(0, 4);
    await source.invalidate();
    expect(source.stats().loadedCount).toBe(0);
    await source.dispose();
  });

  it('fills the entire list when the background scan runs', async () => {
    const { source } = makeSource({
      totalItems: 30,
      background: { batchSize: 5, autoStart: true },
    });

    await source.whenBackgroundIdle();

    expect(source.stats().loadedCount).toBe(30);
    expect(source.stats().background.done).toBe(true);
    await source.dispose();
  });

  it('leaves the background scan off unless it is opted into', async () => {
    const { source, calls } = makeSource({ totalItems: 30 });
    await new Promise((r) => setTimeout(r, 20));
    expect(calls).toEqual([]);
    expect(source.stats().background.running).toBe(false);
    await source.dispose();
  });

  it('starts the background scan on demand', async () => {
    const { source } = makeSource({ totalItems: 20, background: { batchSize: 5 } });
    expect(source.stats().loadedCount).toBe(0);

    source.startBackground();
    await source.whenBackgroundIdle();

    expect(source.stats().loadedCount).toBe(20);
    await source.dispose();
  });

  it('does not refetch rows the viewport already loaded during a background scan', async () => {
    const { source, calls } = makeSource({ totalItems: 20, background: { batchSize: 5 } });
    await source.getRange(0, 4);
    calls.length = 0;

    source.startBackground();
    await source.whenBackgroundIdle();

    for (const [start] of calls) {
      expect(start).toBeGreaterThan(4);
    }
    expect(source.stats().loadedCount).toBe(20);
    await source.dispose();
  });

  it('stops the background scan on dispose', async () => {
    const { source } = makeSource({ totalItems: 500, background: { batchSize: 5, autoStart: true } });
    await source.dispose();
    const after = source.stats().loadedCount;
    await new Promise((r) => setTimeout(r, 20));
    expect(source.stats().loadedCount).toBe(after);
    expect(source.stats().background.running).toBe(false);
  });

  it('grows to cover a list whose length changed', async () => {
    const { source } = makeSource({ totalItems: 5 });
    await source.getRange(0, 4);
    source.setTotalItems(8);
    expect(source.stats().totalItems).toBe(8);
    expect(await source.getRange(0, 7)).toEqual(rows(0, 7));
    await source.dispose();
  });

  it('accepts a synchronous fetchRange', async () => {
    const source = createLazyDataSource<string>({
      totalItems: 5,
      ...backend(),
      fetchRange: (startIndex, endIndex) => rows(startIndex, endIndex),
    });
    expect(await source.getRange(0, 4)).toEqual(rows(0, 4));
    await source.dispose();
  });

  it('rejects a fetchRange that returns the wrong number of rows', async () => {
    const source = createLazyDataSource<string>({
      totalItems: 5,
      ...backend(),
      fetchRange: async () => ['only-one'],
    });
    await expect(source.getRange(0, 4)).rejects.toThrow(/expected 5 rows/i);
    await source.dispose();
  });
});

describe('createLazyDataSource backend selection', () => {
  it('uses the memory backend by default', async () => {
    const source = createLazyDataSource<string>({
      totalItems: 4,
      fetchRange: (s, e) => rows(s, e),
    });
    await source.ready();
    expect(source.backendKind()).toBe('memory');
    await source.dispose();
  });

  it('uses the indexeddb backend when requested', async () => {
    const source = createLazyDataSource<string>({
      totalItems: 4,
      useIndexedDb: { dbName: `lvs-src-${dbCounter++}` },
      fetchRange: (s, e) => rows(s, e),
    });
    await source.ready();
    expect(source.backendKind()).toBe('indexeddb');
    await source.dispose();
  });

  it('keeps only the hot window resident under indexeddb', async () => {
    const source = createLazyDataSource<string>({
      totalItems: 100,
      useIndexedDb: { dbName: `lvs-src-${dbCounter++}` },
      fetchRange: (s, e) => rows(s, e),
    });
    await source.ready();
    await source.getRange(0, 99);
    await source.setViewport(10, 19);

    expect(source.stats().loadedCount).toBe(100);
    expect(source.stats().residentCount).toBe(10);
    expect(source.peek(10, 11)).toEqual(['row-10', 'row-11']);
    expect(source.peek(50, 51)).toEqual([undefined, undefined]);
    expect(await source.getItem(50)).toBe('row-50');

    await source.dispose();
  });
});

describe('createLazyDataSource failure and invalidation races', () => {
  it('abandons a permanently failing batch instead of rescanning it forever', async () => {
    let calls = 0;
    const source = createLazyDataSource<string>({
      totalItems: 20,
      background: { batchSize: 5, maxRetries: 0 },
      fetchRange: async (startIndex, endIndex) => {
        calls++;
        if (startIndex === 5) throw new Error('always fails');
        return rows(startIndex, endIndex);
      },
    });

    source.startBackground();
    await source.whenBackgroundIdle();

    expect(source.stats().background.done).toBe(true);
    expect(source.stats().loadedCount).toBe(15); // everything but the failing batch
    expect(calls).toBeLessThan(20);
    await source.dispose();
  });

  it('discards a fetch that resolves after invalidate', async () => {
    let release: (value: string[]) => void = () => undefined;
    let onStarted: () => void = () => undefined;
    const started = new Promise<void>((resolve) => (onStarted = resolve));

    const source = createLazyDataSource<string>({
      totalItems: 10,
      fetchRange: () =>
        new Promise<string[]>((resolve) => {
          release = resolve;
          onStarted();
        }),
    });

    const pending = source.getRange(0, 3).catch(() => undefined);
    await started;
    await source.invalidate();

    release(['stale-0', 'stale-1', 'stale-2', 'stale-3']);
    await pending;

    expect(source.has(0)).toBe(false);
    expect(source.stats().loadedCount).toBe(0);
    expect(source.peek(0, 3)).toEqual([undefined, undefined, undefined, undefined]);
    await source.dispose();
  });

  it('reports whether it has been disposed', async () => {
    const source = createLazyDataSource<string>({
      totalItems: 4,
      fetchRange: (s, e) => rows(s, e),
    });
    expect(source.isDisposed()).toBe(false);
    await source.dispose();
    expect(source.isDisposed()).toBe(true);
  });
});
