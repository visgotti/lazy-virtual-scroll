import { MemoryRowStore } from './memory-store';
import { describeRowStoreContract } from './row-store.conformance';

describeRowStoreContract('MemoryRowStore', () => new MemoryRowStore<string>());

describe('MemoryRowStore specifics', () => {
  it('identifies itself as the memory backend', () => {
    expect(new MemoryRowStore().kind).toBe('memory');
  });

  it('keeps every written row resident, so peek works outside the hot window', async () => {
    const store = new MemoryRowStore<string>();
    await store.set(0, ['a', 'b', 'c']);
    await store.setHotWindow(0, 0);
    expect(store.peek(2, 2)).toEqual(['c']);
  });
});
