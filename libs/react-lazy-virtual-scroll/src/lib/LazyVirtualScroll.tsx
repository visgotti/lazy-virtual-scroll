import React, { ReactNode, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { resolveIndexes, utils, type Dataset, type ScrollProps } from '@core';
import { useDebounceFn } from './useDebounceFn';
import { useThrottle } from './useThrottle';

export interface VirtualLazyScrollProps<T=unknown> extends ScrollProps<T, React.CSSProperties> {
  className?: string;
  onLoad?: (range: { startIndex: number; endIndex: number }) => void;
  onHide?: (range: { startIndex: number; endIndex: number }) => void;
  onScroll?: (value: number) => void;
  render: (index: number, datum: any) => ReactNode;
  renderLoading?: (index: number) => ReactNode;
}

const LazyVirtualScroll: React.FC<VirtualLazyScrollProps> = ({
  className,
  itemSize,
  totalItems,
  scrollStart = 0,
  scrollThrottle = 0,
  scrollDebounce = 0,
  direction = 'column',
  sortDatasets = true,
  minItemSize = 0,
  autoDetectSizes = false,
  itemBuffer = 3,
  dynamicSizes = {},
  data,
  datasets,
  onLoad,
  onHide,
  onScroll,
  render,
  renderLoading,
  scrollOuterStyleOverrides = {},
  scrollInnerStyleOverrides = {},
}: VirtualLazyScrollProps) => {
  const scrollOuterRef = useRef<HTMLElement | null>(null);
  const scrollInnerRef = useRef<HTMLDivElement>(null);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);
  const [totalLength, setTotalLength] = useState(0);
  const [scrollLength, setScrollLength] = useState(0);
  const [scrollMargin, setScrollMargin] = useState(0);
  const [internalDynamicSizes, setInternalDynamicSizes] = useState<{ [key: number]: number }>({});

  // Track previous range for onHide callback
  const prevRangeRef = useRef<{ startIndex: number; endIndex: number } | null>(null);

  // Use refs to avoid stale closures
  const internalDynamicSizesRef = useRef(internalDynamicSizes);
  internalDynamicSizesRef.current = internalDynamicSizes;
  
  // Track if we're currently updating to prevent feedback loops
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (scrollThrottle && scrollDebounce && scrollThrottle > scrollDebounce) {
      console.warn(
        'Warning: The \'scrollDebounce\' prop value is less than the \'scrollThrottle\' prop value. This configuration is not recommended because if the debounce delay is shorter than the throttle delay, the debounce functionality becomes redundant. Please set \'scrollDebounce\' to be equal to or greater than \'scrollThrottle\' to ensure both functionalities work as intended.'
      );
    }
  }, [scrollThrottle, scrollDebounce]);

  const clientLengthProp = useMemo(() => direction === 'column' ? 'clientHeight' : 'clientWidth', [direction]);
  const lengthProp = useMemo(() => direction === 'column' ? 'height' : 'width', [direction]);
  const scrollProp = useMemo(() => direction === 'column' ? 'scrollTop' : 'scrollLeft', [direction]);
  const marginProp = useMemo(() => direction === 'column' ? 'marginTop' : 'marginLeft', [direction]);
  const marginProp2 = useMemo(() => direction === 'column' ? 'marginBottom' : 'marginRight', [direction]);

  const shouldSortDatasets = useMemo(() => {
    return datasets?.length && sortDatasets;
  }, [datasets, sortDatasets]);
  
  const resizeObservers = useRef<{[index: string]: { el: HTMLElement, observer: ResizeObserver } }>({});

  // Combine dynamic sizes properly
  const dynamicSizesRef = useMemo(() => {
    return autoDetectSizes ? internalDynamicSizes : dynamicSizes;
  }, [autoDetectSizes, internalDynamicSizes, dynamicSizes]);

  const orderedDatasets = useMemo(() => {
    const datasetsEnsured = datasets || [{
      startingIndex: 0, 
      data: data || []
    }];

    if (!shouldSortDatasets) {
      return datasetsEnsured;
    } 
    return datasetsEnsured.sort((a, b) => a.startingIndex - b.startingIndex);
  }, [datasets, data, shouldSortDatasets]);

  const finalArray = useMemo(() => {
    return utils.fillAndFlattenDatasets({
      orderedDatasets,
      startIndex,
      endIndex,
    });
  }, [orderedDatasets, startIndex, endIndex]);

  const handleScroll = useCallback(() => {
    if (!scrollOuterRef.current || isUpdatingRef.current) return;
    
    const resolved = resolveIndexes({
      scrollTop: scrollOuterRef.current[scrollProp],
      viewHeight: scrollOuterRef.current[clientLengthProp],
      itemSize,
      totalItems,
      itemBuffer,
      dynamicSizes: internalDynamicSizesRef.current,
    });

    setTotalLength(resolved.totalItemHeight);
    const nextScrollMargin = scrollOuterRef.current[scrollProp] - resolved.scrollTopPadding;
    setScrollMargin(nextScrollMargin)
    setScrollLength(resolved.totalItemHeight - nextScrollMargin);

    if (resolved.startIndex !== startIndex || resolved.endIndex !== endIndex) {
      const prevRange = prevRangeRef.current;
      
      // Calculate hidden ranges when items go out of view
      if (onHide && (prevRange !== null)) {
        // Items hidden at the beginning (scrolled down past them)
        if (resolved.startIndex > prevRange.startIndex) {
          const hiddenStartIndex = prevRange.startIndex;
          const hiddenEndIndex = Math.min(prevRange.endIndex, resolved.startIndex - 1);
          if (hiddenEndIndex >= hiddenStartIndex) {
            onHide({ startIndex: hiddenStartIndex, endIndex: hiddenEndIndex });
          }
        }
        
        // Items hidden at the end (scrolled up past them)
        if (resolved.endIndex < prevRange.endIndex) {
          const hiddenStartIndex = Math.max(prevRange.startIndex, resolved.endIndex + 1);
          const hiddenEndIndex = prevRange.endIndex;
          if (hiddenEndIndex >= hiddenStartIndex) {
            onHide({ startIndex: hiddenStartIndex, endIndex: hiddenEndIndex });
          }
        }
      }
      
      // Update state and refs
      setStartIndex(resolved.startIndex);
      setEndIndex(resolved.endIndex);
      prevRangeRef.current = { startIndex: resolved.startIndex, endIndex: resolved.endIndex };
      
      if (onLoad) {
        onLoad({ startIndex: resolved.startIndex, endIndex: resolved.endIndex });
      }
    }
  }, [scrollProp, clientLengthProp, itemSize, totalItems, itemBuffer, startIndex, endIndex, onLoad, onHide]);

  // Effect to trigger handleScroll when dynamic sizes change - but debounced
  const debouncedHandleScrollForSizes = useDebounceFn(handleScroll, 16); // ~60fps
  useEffect(() => {
    debouncedHandleScrollForSizes();
  }, [debouncedHandleScrollForSizes, totalItems]);

  // Call hooks unconditionally
  const throttledScrollFn = useThrottle(handleScroll, scrollThrottle || 0, scrollDebounce || scrollThrottle || 0);
  const debouncedScrollFn = useDebounceFn(handleScroll, scrollDebounce || 0);

  // Then conditionally use the results
  const debouncedScroll = scrollDebounce 
    ? debouncedScrollFn 
    : scrollThrottle 
      ? throttledScrollFn 
      : handleScroll;

  useEffect(() => {
    window.addEventListener('scroll', debouncedScroll);
    window.addEventListener('resize', debouncedScroll);
    return () => {
      window.removeEventListener('scroll', debouncedScroll);
      window.removeEventListener('resize', debouncedScroll);
      // Cleanup all observers
      Object.values(resizeObservers.current).forEach(({ observer }) => observer.disconnect());
    };
  }, [debouncedScroll]);

  const handleScrollOuterRef = useCallback((node: HTMLElement | null) => {
    scrollOuterRef.current = node;
    if (!scrollOuterRef.current) return;
    
    scrollOuterRef.current.onscroll = () => {
      debouncedScroll();
      if (onScroll && scrollOuterRef.current) {
        onScroll(scrollOuterRef.current[scrollProp]);
      }
    };
    
    // Handle initial scroll position
    if (scrollStart) {
      setTimeout(() => {
        if (scrollOuterRef.current) {
          scrollOuterRef.current[scrollProp] = scrollStart;
          handleScroll();
        }
      }, 0);
    } else {
      handleScroll();
    }
  }, [debouncedScroll, onScroll, scrollProp, scrollStart, handleScroll]);

  const setItemRef = useCallback((index: number, el: HTMLElement | null) => {
    if (!el || !autoDetectSizes) return;
    
    const finalIndex = startIndex + index;
    
    const computeLength = () => {
      if (isUpdatingRef.current) return;
      
      const length = el.getBoundingClientRect()[lengthProp];
      const style = window.getComputedStyle(el);
      const margin1 = parseFloat(style[marginProp]);
      const margin2 = parseFloat(style[marginProp2]);
      const finalLength = Math.max(length + margin1 + margin2, minItemSize);
      
      // Only update if the size actually changed significantly
      const currentSize = internalDynamicSizesRef.current[finalIndex];
      const shouldUpdate = Math.abs((currentSize || itemSize) - finalLength) > 1;
      
      if (shouldUpdate) {
        isUpdatingRef.current = true;
        setInternalDynamicSizes(prevSizes => {
          const newSizes = { ...prevSizes };
          if (finalLength !== itemSize) {
            newSizes[finalIndex] = finalLength;
          } else {
            delete newSizes[finalIndex];
          }
          return newSizes;
        });
        // Reset flag after state update
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    };

    // Use requestAnimationFrame for better timing
    requestAnimationFrame(() => {
      computeLength();
      
      // Handle resize observer
      const existingObserver = resizeObservers.current[finalIndex];
      if (existingObserver) {
        if (existingObserver.el === el) {
          return; // Same element, no need to recreate observer
        }
        existingObserver.observer.disconnect();
        delete resizeObservers.current[finalIndex];
      }
      
      const observer = new ResizeObserver(() => {
        // Debounce resize observer callbacks
        setTimeout(computeLength, 16);
      });
      observer.observe(el);
      resizeObservers.current[finalIndex] = { observer, el };
    });
  }, [autoDetectSizes, startIndex, lengthProp, marginProp, marginProp2, minItemSize, itemSize]);

  // Cleanup observers for items no longer in view
  useEffect(() => {
    Object.keys(resizeObservers.current).forEach((key) => {
      const observerIndex = parseInt(key);
      if (observerIndex >= startIndex && observerIndex <= endIndex) {
        return;
      }
      resizeObservers.current[key].observer.disconnect();
      delete resizeObservers.current[key];
    });
  }, [startIndex, endIndex]);

  const outerClassName = useMemo(() => {
    return (`scroll-outer ${className || ''}`).trim()
  }, [className])

  const scrollOuterStyleObject = useMemo(() => {
    return { 
      ...utils.scrollOuterStyle(lengthProp, scrollOuterStyleOverrides)
    };
  }, [lengthProp, scrollOuterStyleOverrides]);

  const scrollInnerStyleObject = useMemo(() => {
    return utils.scrollInnerStyle(scrollLength, scrollMargin, direction, scrollInnerStyleOverrides)
  }, [direction, scrollLength, scrollMargin, scrollInnerStyleOverrides]);
  
  const listItemStyle = {
    display: 'inline-block'
  }

  return (
    <div className={outerClassName} ref={handleScrollOuterRef} style={scrollOuterStyleObject}>
      <div className="scroll-inner" ref={scrollInnerRef} style={scrollInnerStyleObject}>
        {finalArray.map((item, index) => (
          <div
            key={index}
            className="list-item"
            style={listItemStyle}
            ref={(el) => autoDetectSizes ? setItemRef(index, el) : undefined}
          >
            {
              (!item && !!renderLoading) ? 
              renderLoading(startIndex + index) :
               render(startIndex + index, item)
            }
          </div>
        ))}
      </div>
    </div>
  );
};

export default LazyVirtualScroll;