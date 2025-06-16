import { useRef, useEffect, useCallback } from 'react';

export function useThrottle<T extends (...args: any[]) => any>(
  fn: T, 
  delay: number, 
  debounce?: number
) {
  const lastCalledRef = useRef(0);
  const timeoutIdRef = useRef<number | undefined>();
  const fnRef = useRef<T>(fn);
  
  // Update the function reference when it changes
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);
  
  return useCallback((...args: Parameters<T>): void => {
    const now = Date.now();
    
    if (now - lastCalledRef.current >= delay) {
      // If enough time has passed since last call, execute immediately
      lastCalledRef.current = now;
      fnRef.current(...args);
      
      // Clear any pending debounce timeout
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = undefined;
      }
    } else if (!timeoutIdRef.current && debounce) {
      // Set up debounced call if enabled and no pending timeout
      timeoutIdRef.current = window.setTimeout(() => {
        lastCalledRef.current = Date.now();
        fnRef.current(...args);
        timeoutIdRef.current = undefined;
      }, debounce);
    }
  }, [delay, debounce]);
}

