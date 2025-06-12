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
function resolveIndexes({
  scrollTop,
  viewHeight,
  itemSize,
  totalItems,
  itemBuffer,
  dynamicSizes
}): {
  startIndex: number;
  endIndex: number;
  totalItemHeight: number;
  scrollTopPadding: number;
}
```

### `fillItemArray`

Populates an array with items from the provided datasets based on the calculated start and end indexes.

```typescript
function fillItemArray({
  orderedDatasets,
  startIndex,
  endIndex
}): any[]
```

## Data Types

### Dataset

```typescript
type Dataset = {
  startingIndex: number,
  data: Array<any>
}
```

### LoadEventPayload

```typescript
type LoadEventPayload = {
  startIndex: number,
  endIndex: number,
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
