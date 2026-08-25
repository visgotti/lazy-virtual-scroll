import type { RowStore } from './types';

/**
 * One suite, run against every RowStore implementation.
 *
 * The whole point of the RowStore boundary is that swapping the backend cannot
 * change observable behaviour ("async parity no matter what"), so parity is
 * enforced here by tests rather than by discipline. Anything asserted below is
 * part of the contract; anything an implementation is free to differ on (e.g.
 * whether rows outside the hot window happen to be resident) is deliberately
 * not asserted.
 */
export const describeRowStoreContract = (
  label: string,
  createStore: () => Promise<RowStore<string>> | RowStore<string>
) => {
  describe(`RowStore contract: ${label}`, () => {
    let store: RowStore<string>;

    beforeEach(async () => {
      store = await createStore();
    });

    afterEach(async () => {
      await store.dispose();
    });

    it('reports nothing loaded before any write', async () => {
      expect(store.loadedCount()).toBe(0);
      expect(store.has(0)).toBe(false);
      expect(await store.get(0)).toBeUndefined();
    });

    it('returns a promise from every async method even when the backend is synchronous', () => {
      // Async parity: consumers must never have to branch on the backend.
      expect(store.set(0, ['a'])).toBeInstanceOf(Promise);
      expect(store.get(0)).toBeInstanceOf(Promise);
      expect(store.getMany(0, 1)).toBeInstanceOf(Promise);
      expect(store.clear()).toBeInstanceOf(Promise);
    });

    it('round-trips a written range', async () => {
      await store.set(10, ['a', 'b', 'c']);
      expect(await store.get(10)).toBe('a');
      expect(await store.get(11)).toBe('b');
      expect(await store.get(12)).toBe('c');
      expect(store.loadedCount()).toBe(3);
    });

    it('reports membership synchronously for written rows', async () => {
      await store.set(10, ['a', 'b', 'c']);
      expect(store.has(9)).toBe(false);
      expect(store.has(10)).toBe(true);
      expect(store.has(12)).toBe(true);
      expect(store.has(13)).toBe(false);
    });

    it('fills gaps with undefined in getMany', async () => {
      await store.set(0, ['a', 'b']);
      await store.set(4, ['e']);
      expect(await store.getMany(0, 5)).toEqual([
        'a',
        'b',
        undefined,
        undefined,
        'e',
        undefined,
      ]);
    });

    it('overwrites rows written twice rather than duplicating them', async () => {
      await store.set(0, ['a', 'b']);
      await store.set(1, ['B', 'c']);
      expect(await store.getMany(0, 2)).toEqual(['a', 'B', 'c']);
      expect(store.loadedCount()).toBe(3);
    });

    it('serves the hot window synchronously once it is hydrated', async () => {
      await store.set(0, ['a', 'b', 'c', 'd']);
      await store.setHotWindow(1, 2);
      expect(store.peek(1, 2)).toEqual(['b', 'c']);
    });

    it('peeks undefined for unwritten rows inside the hot window', async () => {
      await store.set(0, ['a']);
      await store.setHotWindow(0, 2);
      expect(store.peek(0, 2)).toEqual(['a', undefined, undefined]);
    });

    it('follows the hot window as it moves', async () => {
      await store.set(0, ['a', 'b', 'c', 'd', 'e']);
      await store.setHotWindow(0, 1);
      expect(store.peek(0, 1)).toEqual(['a', 'b']);
      await store.setHotWindow(3, 4);
      expect(store.peek(3, 4)).toEqual(['d', 'e']);
    });

    it('returns an array of the requested length from peek regardless of residency', async () => {
      expect(store.peek(0, 3)).toHaveLength(4);
    });

    it('clears every row and resets membership', async () => {
      await store.set(0, ['a', 'b']);
      await store.setHotWindow(0, 1);
      await store.clear();
      expect(store.loadedCount()).toBe(0);
      expect(store.has(0)).toBe(false);
      expect(await store.get(0)).toBeUndefined();
      expect(store.peek(0, 1)).toEqual([undefined, undefined]);
    });

    it('ignores an empty write', async () => {
      await store.set(0, []);
      expect(store.loadedCount()).toBe(0);
    });
  });
};
