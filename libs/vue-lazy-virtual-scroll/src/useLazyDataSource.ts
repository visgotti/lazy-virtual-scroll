import { isRef, onScopeDispose, shallowRef, watch, type Ref } from 'vue';
import {
  createLazyDataSource,
  type LazyDataSource,
  type LazyDataSourceOptions,
} from '@core';

/** `totalItems` may be a plain number, a ref, or a getter. */
export type MaybeReactive<T> = T | Ref<T> | (() => T);

export type UseLazyDataSourceOptions<T> = Omit<LazyDataSourceOptions<T>, 'totalItems'> & {
  totalItems: MaybeReactive<number>;
};

const read = <T>(value: MaybeReactive<T>): T => {
  if (typeof value === 'function') return (value as () => T)();
  if (isRef(value)) return value.value;
  return value as T;
};

/**
 * Creates a `LazyDataSource` bound to the current effect scope: it is disposed
 * with the component, and a reactive `totalItems` is forwarded to it so a list
 * that grows does not need the source rebuilt.
 */
export const useLazyDataSource = <T = unknown>(
  options: UseLazyDataSourceOptions<T>
): LazyDataSource<T> => {
  const { totalItems, ...rest } = options;

  const source = createLazyDataSource<T>({
    ...rest,
    totalItems: read(totalItems),
  });

  if (typeof totalItems === 'function' || isRef(totalItems)) {
    watch(
      () => read(totalItems),
      (next) => source.setTotalItems(next)
    );
  }

  onScopeDispose(() => void source.dispose());

  return source;
};

/**
 * A ref that bumps whenever the source changes.
 *
 * `LazyVirtualScroll` tracks the source itself, so this is only for UI built
 * around it — a loaded counter, a background-scan progress bar.
 */
export const useLazyDataSourceVersion = (
  source: LazyDataSource<unknown>
): Ref<number> => {
  const version = shallowRef(source.getVersion());
  const unsubscribe = source.subscribe(() => {
    version.value = source.getVersion();
  });
  onScopeDispose(unsubscribe);
  return version;
};
