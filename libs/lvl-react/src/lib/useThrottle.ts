
import { useRef } from 'react';

export function useThrottle(fn: (...args: any[]) => any, delay: number, debounce?: number) {
  const lastCalled = useRef(0);
  let timeoutId: any = null;

  function throttle(func: (...args: any[]) => any, wait: number) {
    const now = Date.now();
    if (now - lastCalled.current >= wait) {
      lastCalled.current = now;
      func();
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    } else if (!timeoutId && debounce) {
      timeoutId = setTimeout(() => {
        lastCalled.current = Date.now();
        func();
        timeoutId = null;
      }, debounce);
    }
  }

  const throttledFn = (...args: any[]) => throttle(() => fn(...args), delay);
  return throttledFn;
}

