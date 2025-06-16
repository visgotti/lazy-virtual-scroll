import { ref, unref, Ref } from 'vue';

// Define a generic type for the function
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  fn: T, 
  delay: number | Ref<number>, 
  debounce?: number | Ref<number>
) {
  const lastCalled = ref<number>(0);
  const timeoutId = ref<ReturnType<typeof setTimeout> | null>(null);

  const throttledFn = function(...args: Parameters<T>): ReturnType<T> | undefined {
    const now = Date.now();
    const currentDelay = unref(delay);
    const currentDebounce = debounce ? unref(debounce) : undefined;
    
    if (now - lastCalled.value >= currentDelay) {
      // Time has elapsed, execute immediately
      lastCalled.value = now;
      
      // Clear any pending debounce
      if (timeoutId.value) {
        clearTimeout(timeoutId.value);
        timeoutId.value = null;
      }
      
      return fn(...args) as ReturnType<T>;
    } else if (!timeoutId.value && currentDebounce) {
      // Set up debounced call if enabled and no pending timeout
      return new Promise<ReturnType<T>>((resolve) => {
        timeoutId.value = setTimeout(() => {
          lastCalled.value = Date.now();
          const result = fn(...args) as ReturnType<T>;
          timeoutId.value = null;
          resolve(result);
        }, currentDebounce);
      }) as unknown as ReturnType<T>;
    }
    
    return undefined;
  };
  
  return throttledFn as (...args: Parameters<T>) => ReturnType<T> | undefined;
}
