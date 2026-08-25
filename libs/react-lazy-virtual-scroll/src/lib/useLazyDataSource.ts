import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createLazyDataSource,
  type LazyDataSource,
  type LazyDataSourceOptions,
} from '@core';

export type UseLazyDataSourceOptions<T> = LazyDataSourceOptions<T>;

/**
 * Creates a `LazyDataSource` tied to the component's lifetime.
 *
 * `fetchRange` is held in a ref, so an inline arrow function does not tear down
 * and rebuild the cache on every render. The source is only recreated when
 * something structural changes (backend, batch size, background config); a
 * changed `totalItems` updates it in place instead.
 */
export const useLazyDataSource = <T = unknown>(
  options: UseLazyDataSourceOptions<T>
): LazyDataSource<T> => {
  const { totalItems, fetchRange, useIndexedDb, batchSize, background } = options;

  const fetchRef = useRef(fetchRange);
  fetchRef.current = fetchRange;

  const totalItemsRef = useRef(totalItems);
  totalItemsRef.current = totalItems;

  const structuralKey = useMemo(
    () => JSON.stringify({ useIndexedDb, batchSize, background }),
    [useIndexedDb, batchSize, background]
  );

  const create = useCallback(
    () =>
      createLazyDataSource<T>({
        totalItems: totalItemsRef.current,
        useIndexedDb,
        batchSize,
        background,
        fetchRange: (startIndex, endIndex) => fetchRef.current(startIndex, endIndex),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [structuralKey]
  );

  const [source, setSource] = useState<LazyDataSource<T>>(create);
  const structuralKeyRef = useRef(structuralKey);

  /**
   * Owns both rebuilding and disposal.
   *
   * StrictMode mounts, unmounts and remounts in development, so a plain
   * "dispose on cleanup" effect would leave the remount holding a source its
   * own simulated unmount had already disposed -- the list would render its
   * loading output forever. Checking isDisposed() on entry lets the remount
   * rebuild instead. The rebuild branch returns no cleanup on purpose: the
   * re-render this triggers runs the effect again, and that pass takes
   * ownership of the new source.
   */
  useEffect(() => {
    if (structuralKeyRef.current !== structuralKey || source.isDisposed()) {
      structuralKeyRef.current = structuralKey;
      setSource(create());
      return;
    }
    return () => void source.dispose();
  }, [source, structuralKey, create]);

  useEffect(() => {
    source.setTotalItems(totalItems);
  }, [source, totalItems]);

  return source;
};

/**
 * Re-renders the calling component whenever the source changes.
 *
 * `LazyVirtualScroll` subscribes on its own, so this is only needed for UI built
 * around the source — a loading counter, a background-scan progress bar.
 */
export const useLazyDataSourceVersion = (
  source: LazyDataSource<unknown> | undefined | null
): number => {
  const [version, setVersion] = useState(() => source?.getVersion() ?? 0);

  useEffect(() => {
    if (!source) return;
    setVersion(source.getVersion());
    return source.subscribe(() => setVersion(source.getVersion()));
  }, [source]);

  return version;
};
