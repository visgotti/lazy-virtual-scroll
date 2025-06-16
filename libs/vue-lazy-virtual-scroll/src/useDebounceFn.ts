import { unref, Ref, ref } from 'vue';

export function useDebounceFn<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number | Ref<number>
) {
  const timeoutId = ref<ReturnType<typeof setTimeout> | undefined>(undefined);

  const debouncedFn = function(this: unknown, ...args: Parameters<T>): ReturnType<T> | Promise<ReturnType<T>> | undefined {
    if (timeoutId.value) {
      clearTimeout(timeoutId.value);
    }
    
    const currentDelay = unref(delay);
    
    if (currentDelay === 0) {
      // If delay is 0, execute immediately
      return fn.apply(this, args as unknown[]) as ReturnType<T>;
    }
    
    return new Promise<ReturnType<T>>((resolve) => {
      timeoutId.value = window.setTimeout(() => {
        const result = fn.apply(this, args as unknown[]) as ReturnType<T>;
        timeoutId.value = undefined;
        resolve(result);
      }, currentDelay);
    });
  };
  
  return debouncedFn as (...args: Parameters<T>) => ReturnType<T> | Promise<ReturnType<T>> | undefined;
}