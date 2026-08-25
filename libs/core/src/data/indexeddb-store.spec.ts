import 'fake-indexeddb/auto';
import { IndexedDbRowStore, createRowStore } from './indexeddb-store';
import { MemoryRowStore } from './memory-store';
import { describeRowStoreContract } from './row-store.conformance';

let dbCounter = 0;

describeRowStoreContract('IndexedDbRowStore', async () => {
  const store = new IndexedDbRowStore<string>({ dbName: `lvs-test-${dbCounter++}` });
  await store.ready();
  return store;
});

describe('IndexedDbRowStore specifics', () => {
  it('identifies itself as the indexeddb backend', async () => {
    const store = new IndexedDbRowStore({ dbName: `lvs-test-${dbCounter++}` });
    await store.ready();
    expect(store.kind).toBe('indexeddb');
    await store.dispose();
  });

  it('does not hold rows outside the hot window in memory', async () => {
    const store = new IndexedDbRowStore<string>({ dbName: `lvs-test-${dbCounter++}` });
    await store.ready();
    await store.set(0, ['a', 'b', 'c', 'd']);
    await store.setHotWindow(0, 1);

    // Rows 2-3 are durable but evicted from the heap: reachable only via await.
    expect(store.peek(2, 3)).toEqual([undefined, undefined]);
    expect(store.residentCount()).toBe(2);
    expect(await store.get(2)).toBe('c');

    await store.dispose();
  });

  it('starts empty even if a database of the same name already had rows', async () => {
    const dbName = `lvs-test-shared-${dbCounter++}`;
    const first = new IndexedDbRowStore<string>({ dbName });
    await first.ready();
    await first.set(0, ['a']);
    await first.close();

    // Session-scoped: a fresh store wipes rather than inheriting stale rows.
    const second = new IndexedDbRowStore<string>({ dbName });
    await second.ready();
    expect(second.loadedCount()).toBe(0);
    expect(await second.get(0)).toBeUndefined();
    await second.dispose();
  });
});

describe('createRowStore', () => {
  it('returns a memory store when indexeddb is not requested', async () => {
    const store = await createRowStore({ useIndexedDb: false });
    expect(store.kind).toBe('memory');
    await store.dispose();
  });

  it('falls back to memory when indexeddb is unavailable', async () => {
    const original = globalThis.indexedDB;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).indexedDB;
    const warn = jest_spy();
    try {
      const store = await createRowStore({ useIndexedDb: true });
      expect(store.kind).toBe('memory');
      expect(store).toBeInstanceOf(MemoryRowStore);
      await store.dispose();
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).indexedDB = original;
      warn.restore();
    }
  });
});

const jest_spy = () => {
  const original = console.warn;
  console.warn = () => undefined;
  return { restore: () => { console.warn = original; } };
};
