import React, { ReactNode, useCallback, useEffect, useRef, useState, useMemo, type PropsWithChildren } from 'react';
import { resolveIndexes, fillItemArray, type Dataset } from '@core';
import { useDebounceFn } from './useDebounceFn';
import { useThrottle } from './useThrottle';
import './LazyVirtualList.scss';

interface VirtualListProps {
  className?: string;
  scrollStart?: number;
  scrollThrottle?: number;
  scrollDebounce?: number;
  direction?: 'row' | 'column';
  sortDatasets?: boolean;
  data?: any[];
  datasets?: Dataset[];
  itemBuffer?: number;
  totalItems: number;
  itemSize: number;
  minItemSize?: number;
  dynamicSizes?: { [itemIndex: string]: number };
  autoDetectSizes?: boolean;
  onLoad?: (range: { startIndex: number; endIndex: number }) => void;
  onScroll?: (value: number) => void;
  render: (index: number, datum: any) => ReactNode,
  renderLoading?: (index: number) => ReactNode,
}

const LazyVirtualList: React.FC<VirtualListProps> = ({
  className,
  scrollStart = 0,
  scrollThrottle = 0,
  scrollDebounce = 0,
  direction = 'column',
  sortDatasets = true,
  data,
  datasets,
  itemBuffer = 3,
  totalItems,
  itemSize,
  minItemSize = 0,
  dynamicSizes = {},
  autoDetectSizes = false,
  onLoad,
  onScroll,
  render,
  renderLoading
}: VirtualListProps) => {
  const scrollOuterRef = useRef<HTMLElement | null>(null);
  const scrollInnerRef = useRef<HTMLDivElement>(null);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);
  const [totalLength, setTotalLength] = useState(0);
  const [scrollLength, setScrollLength] = useState(0);
  const [scrollMargin, setScrollMargin] = useState(0);
  const [internalDynamicSizes, setInternalDynamicSizes] = useState<{ [key: number]: number }>({});

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

  useEffect(() => {
    handleScroll();
  }, [dynamicSizes, totalItems]);

  
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
  // console.log('fillItemArray', { orderedDatasets, startIndex, endIndex })
  return fillItemArray({
    orderedDatasets,
    startIndex,
    endIndex,
  });
}, [orderedDatasets, startIndex, endIndex]);

  //console.log('finalArray', finalArray);
  const handleScroll = () => {
    if (!scrollOuterRef.current) return;
    
    /*
    console.log({
      scrollTop: scrollOuterRef.current[scrollProp],
      viewHeight: scrollOuterRef.current[clientLengthProp],
      itemSize,
      totalItems,
      itemBuffer,
      dynamicSizes: internalDynamicSizes,
    }) */
    const resolved = resolveIndexes({
      scrollTop: scrollOuterRef.current[scrollProp],
      viewHeight: scrollOuterRef.current[clientLengthProp],
      itemSize,
      totalItems,
      itemBuffer,
      dynamicSizes: internalDynamicSizes,
    });
     // console.log('RESOLVED:', resolved);
    setTotalLength(resolved.totalItemHeight);
    const nextScrollMargin = scrollOuterRef.current[scrollProp] - resolved.scrollTopPadding;
    setScrollMargin(nextScrollMargin)
    setScrollLength(resolved.totalItemHeight - nextScrollMargin);

    if (resolved.startIndex !== startIndex || resolved.endIndex !== endIndex) {
      setStartIndex(resolved.startIndex);
      setEndIndex(resolved.endIndex);
      if (onLoad) {
        onLoad({ startIndex: resolved.startIndex, endIndex: resolved.endIndex });
      }
    }
  };

  const throttledScroll = useThrottle(handleScroll, scrollThrottle, scrollDebounce || scrollThrottle)
  const debouncedScroll = useDebounceFn(handleScroll, scrollDebounce)

  useEffect(() => {
    window.addEventListener('scroll', debouncedScroll);
    window.addEventListener('resize', debouncedScroll);
    return () => {
      window.removeEventListener('scroll', debouncedScroll);
      window.removeEventListener('resize', debouncedScroll);
    };
  }, [debouncedScroll]);

  const handleScrollOuterRef = useCallback((node: HTMLElement) => {
    scrollOuterRef.current = node;
    if (!scrollOuterRef.current) return;
    scrollOuterRef.current.onscroll = () => {
      debouncedScroll();
      if (onScroll && scrollOuterRef.current) {
        onScroll(scrollOuterRef.current[scrollProp]);
      }
    };
    if (scrollStart) {
      scrollOuterRef.current[scrollProp] = scrollStart;
      handleScroll();
    }
  }, []) as any;

  const setItemRef = useCallback((index: number, el: HTMLElement) => {
    if (el && autoDetectSizes) {
      const finalIndex = startIndex + index;
    //   console.log({ startIndex, index })
      const existingObserver2 = resizeObservers.current[finalIndex];
      if(existingObserver2) {
        return;
        console.log('ALREADY EXISTED WAS SAME', existingObserver2.el === el);
      }
      const computeLength = () => {
        const length = el.getBoundingClientRect()[lengthProp];
        const style = window.getComputedStyle(el);
        const margin1 = parseFloat(style[marginProp]);
        const margin2 = parseFloat(style[marginProp2]);
        const finalLength = Math.max(length + margin1 + margin2, minItemSize);
        const copiedDynamicSizes = {...internalDynamicSizes}
        if(finalLength !== itemSize) {
          copiedDynamicSizes[finalIndex] = finalLength;
        } else {
          delete copiedDynamicSizes[finalIndex];
        }
        setInternalDynamicSizes(copiedDynamicSizes);
      }
      handleScroll();
      setTimeout(() => {
        computeLength();

    
        const existingObserver = resizeObservers.current[finalIndex];
        if (existingObserver) {
          if(existingObserver.el === el) {
            return;
          }
          existingObserver.observer.disconnect();
          delete resizeObservers.current[finalIndex];
        }
        resizeObservers.current[finalIndex] = { observer: new ResizeObserver(computeLength), el }
      }, 1);
        
    }
  }, [setInternalDynamicSizes, internalDynamicSizes, marginProp, marginProp2, autoDetectSizes, itemSize, lengthProp, minItemSize, startIndex]);

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

  const capitalize = (v: string) => {
    return v.at(0)?.toUpperCase() + v.slice(1)
  }

  const outerClassName = useMemo(() => {
    return (`scroll-outer ${className || ''}`).trim()
  }, [className])

  const outerStyle = useMemo(() => {
    return { 
      [`max${capitalize(lengthProp)}`]: '100%', 
      [`min${capitalize(lengthProp)}`]: '100%' 
    };;
  }, [lengthProp]);

  const innerStyle = useMemo(() => {
    return { 
      ['flexDirection']: direction, 
      [lengthProp]: `${scrollLength}px`,
      [`max${capitalize(lengthProp)}`]: `${scrollLength}px`, 
      [`min${capitalize(lengthProp)}`]: `${scrollLength}px`, 
      [`${marginProp}`]: `${scrollMargin}px`
     }
  }, [direction, lengthProp, scrollLength, scrollMargin, marginProp]);
  
  return (
    <div className={outerClassName} ref={handleScrollOuterRef} style={outerStyle}>
      <div className="scroll-inner" ref={scrollInnerRef} style={innerStyle}>
        {finalArray.map((item, index) => (
          <div
            key={index}
            className="list-item"
            ref={(el) => setItemRef(index, el as HTMLElement)}
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

export default LazyVirtualList;
