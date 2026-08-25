import 'fake-indexeddb/auto';
import { h } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createLazyDataSource } from '@core';
import LazyVirtualScroll from './LazyVirtualScroll.vue';

interface Row {
  text: string;
}

const makeRows = (startIndex: number, endIndex: number): Row[] =>
  Array.from({ length: endIndex - startIndex + 1 }, (_, i) => ({
    text: `row-${startIndex + i}`,
  }));

// jsdom implements neither observer the component reaches for.
class NoopResizeObserver {
  observe() { /* noop */ }
  disconnect() { /* noop */ }
  unobserve() { /* noop */ }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).ResizeObserver = NoopResizeObserver;

const slots = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => h('span', props.item ? props.item.text : ''),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loading: (props: any) => h('span', `loading-${props.index}`),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mountList = (props: Record<string, any>) =>
  mount(LazyVirtualScroll, {
    props: { totalItems: 10, itemSize: 20, itemBuffer: 3, ...props },
    slots,
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderedTexts = (wrapper: any) =>
  wrapper.findAll('.list-item').map((el: { text: () => string }) => el.text());

/**
 * IndexedDB work only advances on real macrotasks, which flushPromises does not
 * provide, so anything touching that backend has to be polled.
 */
const waitUntil = async (predicate: () => boolean, timeout = 2000) => {
  const deadline = Date.now() + timeout;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error('timed out waiting for condition');
    await new Promise((resolve) => setTimeout(resolve, 10));
    await flushPromises();
  }
};

/**
 * jsdom reports clientHeight 0, so the component settles on rows 0-3 (the first
 * row plus itemBuffer) — enough to prove both data paths render the same rows.
 */
describe('LazyVirtualScroll source integration', () => {
  it('renders from the data prop exactly as before', async () => {
    const wrapper = mountList({ data: makeRows(0, 9) });
    await flushPromises();
    expect(renderedTexts(wrapper)).toEqual(['row-0', 'row-1', 'row-2', 'row-3']);
  });

  it('renders identical rows from a source', async () => {
    const source = createLazyDataSource<Row>({
      totalItems: 10,
      fetchRange: (s, e) => makeRows(s, e),
    });

    const wrapper = mountList({ source });
    await flushPromises();

    expect(renderedTexts(wrapper)).toEqual(['row-0', 'row-1', 'row-2', 'row-3']);
    await source.dispose();
  });

  it('renders the loading slot until the source resolves', async () => {
    let release: (rows: Row[]) => void = () => undefined;
    const source = createLazyDataSource<Row>({
      totalItems: 10,
      fetchRange: () => new Promise<Row[]>((resolve) => (release = resolve)),
    });

    const wrapper = mountList({ source });
    await flushPromises();
    expect(renderedTexts(wrapper)).toEqual([
      'loading-0',
      'loading-1',
      'loading-2',
      'loading-3',
    ]);

    release(makeRows(0, 3));
    await flushPromises();
    expect(renderedTexts(wrapper)).toEqual(['row-0', 'row-1', 'row-2', 'row-3']);
    await source.dispose();
  });

  it('asks the source only for the visible range, not the whole list', async () => {
    const calls: Array<[number, number]> = [];
    const source = createLazyDataSource<Row>({
      totalItems: 1000,
      fetchRange: (s, e) => {
        calls.push([s, e]);
        return makeRows(s, e);
      },
    });

    mountList({ totalItems: 1000, source });
    await flushPromises();

    expect(calls).toEqual([[0, 3]]);
    await source.dispose();
  });

  it('renders from an IndexedDB-backed source without any consumer change', async () => {
    const source = createLazyDataSource<Row>({
      totalItems: 10,
      useIndexedDb: { dbName: 'lvs-vue-spec' },
      fetchRange: (s, e) => makeRows(s, e),
    });

    const wrapper = mountList({ source });
    await waitUntil(() => renderedTexts(wrapper)[0] === 'row-0');

    expect(renderedTexts(wrapper)).toEqual(['row-0', 'row-1', 'row-2', 'row-3']);
    expect(source.backendKind()).toBe('indexeddb');
    await source.dispose();
  });

  it('still emits load when a source is driving the rows', async () => {
    const source = createLazyDataSource<Row>({
      totalItems: 10,
      fetchRange: (s, e) => makeRows(s, e),
    });

    const wrapper = mountList({ source });
    await flushPromises();

    expect(wrapper.emitted('load')).toEqual([[{ startIndex: 0, endIndex: 3 }]]);
    await source.dispose();
  });
});
