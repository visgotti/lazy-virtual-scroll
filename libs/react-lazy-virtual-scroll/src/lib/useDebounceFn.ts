export function useDebounceFn(fn: (...args: any[]) => any, delay: number) {
  let timeoutId: number | undefined;

  return function (this: any, ...args: any[]) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}
