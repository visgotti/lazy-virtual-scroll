# Lazy Virtual Scroll Core

This library contains the core utilities and algorithms used by both the React and Vue implementations of the Lazy Virtual Scroll component.

## Overview

The core library handles the complex calculations needed for virtual scrolling, including:

1. Determining which items should be rendered based on scroll position
2. Calculating proper scroll positions and offsets
3. Managing the dataset structure and filling item arrays
4. Handling dynamic item sizing

## Key Functions

### `resolveIndexes`

Calculates which items should be rendered based on the current scroll position and viewport size.

```typescript
function resolveIndexes(params: {
  scrollTop: number;
  viewHeight: number;
  itemSize: number;
  totalItems: number;
  itemBuffer?: number;
  dynamicSizes?: { [key: number]: number };
  direction?: 'row' | 'column';
  minItemSize?: number;
}): {
  startIndex: number;
  endIndex: number;
  totalItemHeight: number;
  scrollTopPadding: number;
}
```

### `fillAndFlattenDatasets`

Populates an array with items from the provided datasets based on the calculated start and end indexes.

```typescript
function fillAndFlattenDatasets(params: {
  orderedDatasets: Dataset[];
  startIndex: number;
  endIndex: number;
}): any[]
```

## Data Types

### ScrollProps

The core configuration interface used by both React and Vue implementations:

```typescript
interface ScrollProps<T=unknown, CSSPropOverrides=any> {
  itemSize: number;                    // Base height/width of each item
  minItemSize: number;                 // Minimum size for dynamically sized items
  totalItems: number;                  // Total number of items in the list
  scrollStart?: number;                // Initial scroll position
  scrollThrottle?: number;             // Throttle scroll events (ms)
  scrollDebounce?: number;             // Debounce scroll events (ms)
  itemBuffer?: number;                 // Items to render outside viewport
  sortDatasets?: boolean;              // Auto-sort datasets by startingIndex
  direction?: 'row' | 'column';        // Scroll direction
  autoDetectSizes?: boolean;           // Automatically detect item sizes
  dynamicSizes?: { [itemIndex: string]: number }; // Manual size overrides
  data?: T[];                          // Array of data items
  datasets?: Dataset<T>[];             // Alternative fragmented datasets
  scrollOuterStyleOverrides?: CSSPropOverrides; // Outer container styles
  scrollInnerStyleOverrides?: CSSPropOverrides; // Inner container styles
}
```

### Dataset

### Dataset

Represents a chunk of data with a starting index:

```typescript
type Dataset<T=unknown> = {
  startingIndex: number;   // Index where this dataset starts
  data: Array<T>;          // Array of items in this dataset
}
```

### LoadEventPayload

Payload for load and hide events:

```typescript
type LoadEventPayload = {
  startIndex: number;      // First visible/hidden item index
  endIndex: number;        // Last visible/hidden item index
}
```

## Building

Run `nx build core` to build the library.

## Running unit tests

Run `nx test core` to execute the unit tests via [Vitest](https://vitest.dev/).

## For Contributors

If you're contributing to the Lazy Virtual Scroll libraries, you'll work with this core library when:

1. Implementing new scrolling algorithms
2. Fixing bugs in the virtual rendering logic
3. Optimizing performance of the core calculations
4. Adding new features that affect both React and Vue implementations

The core library is intentionally framework-agnostic to maintain consistency between the React and Vue implementations.
