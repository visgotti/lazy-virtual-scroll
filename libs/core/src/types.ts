export type Dataset<T=unknown> = {
  startingIndex: number,
  data: Array<T>
}

export type LoadEventPayload = {
  startIndex: number,
  endIndex: number,
}

// Common scroll props interface used by both React and Vue demos
export interface ScrollProps<T=unknown, CSSPropOverrides=any> {
  itemSize: number;
  minItemSize: number;
  totalItems: number;
  scrollStart?: number;
  scrollThrottle?: number;
  scrollDebounce?: number;
  itemBuffer?: number;
  sortDatasets?: boolean;
  direction?: 'row' | 'column';
  autoDetectSizes?: boolean;
  dynamicSizes?: { [itemIndex: string]: number };
  data?: T[];
  datasets?: Dataset<T>[];

  scrollOuterStyleOverrides?: CSSPropOverrides;
  scrollInnerStyleOverrides?: CSSPropOverrides;
}

// Default values for the scroll props
export const defaultScrollProps: Omit<ScrollProps, 'totalItems'> = {
  itemSize: 65,
  itemBuffer: 3,
  scrollStart: 0,
  scrollThrottle: 0,
  scrollDebounce: 100,
  minItemSize: 0,
  autoDetectSizes: true,
  direction: 'column',
  sortDatasets: true
};