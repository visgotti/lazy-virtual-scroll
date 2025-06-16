import { useRef, useEffect, useCallback } from 'react';

export function useDebounceFn<T extends (...args: unknown[]) => unknown>(fn: T, delay: number) {
  // In browser environments, setTimeout returns a number, not a Timeout object
  const timeoutRef = useRef<number | undefined>();
  const fnRef = useRef<T>(fn);
  
  // Update the function reference when it changes
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);
  
  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return useCallback((...args: Parameters<T>): ReturnType<T> | undefined => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (delay === 0) {
      // If delay is 0, execute immediately
      return fnRef.current(...args) as ReturnType<T>;
    }
    
    return new Promise<ReturnType<T>>((resolve) => {
      timeoutRef.current = window.setTimeout(() => {
        const result = fnRef.current(...args) as ReturnType<T>;
        resolve(result);
      }, delay);
    }) as unknown as ReturnType<T> | undefined;
  }, [delay]);
}
