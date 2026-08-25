import 'fake-indexeddb/auto';
import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { createLazyDataSource } from '@core';
import { useLazyDataSource } from './useLazyDataSource';
import LazyVirtualScroll from './LazyVirtualScroll';

interface Row {
  text: string;
}

const makeRows = (startIndex: number, endIndex: number): Row[] =>
  Array.from({ length: endIndex - startIndex + 1 }, (_, i) => ({
    text: `row-${startIndex + i}`,
  }));

const renderedTexts = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('.list-item')).map((el) => el.textContent);

const common = { totalItems: 10, itemSize: 20, itemBuffer: 3 };
const renderRow = (_index: number, item: Row | null) => <span>{item ? item.text : 'loading'}</span>;

afterEach(cleanup);

/**
 * jsdom reports clientHeight 0, so resolveIndexes settles on rows 0-3 (the
 * first row plus itemBuffer). That is enough to prove both data paths render
 * the same thing through the same code.
 */
describe('LazyVirtualScroll source integration', () => {
  it('renders from the datasets prop exactly as before', () => {
    const { container } = render(
      <LazyVirtualScroll {...common} data={makeRows(0, 9)} render={renderRow} />
    );
    expect(renderedTexts(container)).toEqual(['row-0', 'row-1', 'row-2', 'row-3']);
  });

  it('renders identical rows from a source', async () => {
    const source = createLazyDataSource<Row>({
      totalItems: 10,
      fetchRange: (s, e) => makeRows(s, e),
    });

    const { container } = render(
      <LazyVirtualScroll {...common} source={source} render={renderRow} />
    );

    await waitFor(() =>
      expect(renderedTexts(container)).toEqual(['row-0', 'row-1', 'row-2', 'row-3'])
    );
    await source.dispose();
  });

  it('renders the loading output until the source resolves', async () => {
    let release: (rows: Row[]) => void = () => undefined;
    let onFetchStarted: () => void = () => undefined;
    // setViewport awaits the store before calling fetchRange, so the fetch has
    // not started yet when render() returns.
    const fetchStarted = new Promise<void>((resolve) => (onFetchStarted = resolve));

    const source = createLazyDataSource<Row>({
      totalItems: 10,
      fetchRange: () =>
        new Promise<Row[]>((resolve) => {
          release = resolve;
          onFetchStarted();
        }),
    });

    const { container } = render(
      <LazyVirtualScroll
        {...common}
        source={source}
        render={renderRow}
        renderLoading={(index) => <span>{`loading-${index}`}</span>}
      />
    );

    expect(renderedTexts(container)).toEqual([
      'loading-0',
      'loading-1',
      'loading-2',
      'loading-3',
    ]);

    await fetchStarted;
    release(makeRows(0, 3));
    await waitFor(() =>
      expect(renderedTexts(container)).toEqual(['row-0', 'row-1', 'row-2', 'row-3'])
    );
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

    render(<LazyVirtualScroll {...common} totalItems={1000} source={source} render={renderRow} />);

    await waitFor(() => expect(calls.length).toBeGreaterThan(0));
    expect(calls).toEqual([[0, 3]]);
    await source.dispose();
  });

  it('renders from an IndexedDB-backed source without any consumer change', async () => {
    const source = createLazyDataSource<Row>({
      totalItems: 10,
      useIndexedDb: { dbName: 'lvs-react-spec' },
      fetchRange: (s, e) => makeRows(s, e),
    });

    const { container } = render(
      <LazyVirtualScroll {...common} source={source} render={renderRow} />
    );

    await waitFor(() =>
      expect(renderedTexts(container)).toEqual(['row-0', 'row-1', 'row-2', 'row-3'])
    );
    expect(source.backendKind()).toBe('indexeddb');
    await source.dispose();
  });

  it('still fires onLoad when a source is driving the rows', async () => {
    const loads: Array<{ startIndex: number; endIndex: number }> = [];
    const source = createLazyDataSource<Row>({
      totalItems: 10,
      fetchRange: (s, e) => makeRows(s, e),
    });

    render(
      <LazyVirtualScroll
        {...common}
        source={source}
        render={renderRow}
        onLoad={(range) => loads.push(range)}
      />
    );

    await waitFor(() => expect(loads).toEqual([{ startIndex: 0, endIndex: 3 }]));
    await source.dispose();
  });
});

describe('useLazyDataSource lifecycle', () => {
  const Harness = ({ totalItems = 10 }: { totalItems?: number }) => {
    const source = useLazyDataSource<Row>({
      totalItems,
      fetchRange: (s, e) => makeRows(s, e),
    });
    return (
      <LazyVirtualScroll {...common} totalItems={totalItems} source={source} render={renderRow} />
    );
  };

  it('survives StrictMode double-mounting', async () => {
    // StrictMode mounts, unmounts and remounts; the memoised source must not be
    // left disposed by the simulated unmount.
    const { container } = render(
      <React.StrictMode>
        <Harness />
      </React.StrictMode>
    );

    await waitFor(() =>
      expect(renderedTexts(container)).toEqual(['row-0', 'row-1', 'row-2', 'row-3'])
    );
  });

  it('renders the new rows when the source prop is swapped', async () => {
    const first = createLazyDataSource<Row>({
      totalItems: 10,
      fetchRange: (s, e) => makeRows(s, e),
    });
    const second = createLazyDataSource<Row>({
      totalItems: 10,
      fetchRange: (s, e) => makeRows(s, e).map((r) => ({ text: `alt-${r.text}` })),
    });

    const { container, rerender } = render(
      <LazyVirtualScroll {...common} source={first} render={renderRow} />
    );
    await waitFor(() => expect(renderedTexts(container)[0]).toBe('row-0'));

    rerender(<LazyVirtualScroll {...common} source={second} render={renderRow} />);
    await waitFor(() => expect(renderedTexts(container)[0]).toBe('alt-row-0'));

    await first.dispose();
    await second.dispose();
  });
});
