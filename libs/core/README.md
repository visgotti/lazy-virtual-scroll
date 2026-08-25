# Lazy Virtual Scroll Core

This library contains the core utilities and algorithms used by both the React and Vue implementations of the Lazy Virtual Scroll component.

## Overview

The core library handles the complex calculations needed for virtual scrolling, including:

1. Determining which items should be rendered based on scroll position
2. Calculating proper scroll positions and offsets
3. Managing the dataset structure and filling item arrays
4. Handling dynamic item sizing

## Exports

`core` is `private: true` — it is never published on its own, it is bundled into
`@lazy-virtual-scroll/react` and `@lazy-virtual-scroll/vue`. Inside this workspace it is imported
through the `@core` (or `@lazy-virtual-scroll/core`) tsconfig path alias:

```typescript
import { resolveIndexes, defaultScrollProps, utils } from '@core';
import type { Dataset, LoadEventPayload, ScrollProps } from '@core';
```

Consumers of the published packages reach the same values through the React entry point, which
re-exports all of core:

```typescript
import { resolveIndexes, defaultScrollProps, utils } from '@lazy-virtual-scroll/react';
```

The Vue entry point re-exports only the types (`Dataset`, `LoadEventPayload`, `ScrollProps`), not
the runtime helpers.

`resolveIndexes`, `defaultScrollProps` and the types are top-level exports. Every helper below
lives on the `utils` namespace object (`utils.fillAndFlattenDatasets(...)`), not at the top level.

## Key Functions

### `resolveIndexes`

Calculates which items should be rendered based on the current scroll position and viewport size.
`scrollTop`/`viewHeight` are the scroll offset and viewport length along the active axis, so for
`direction: 'row'` you pass `scrollLeft`/`clientWidth`. The function itself is axis-agnostic and
takes no `direction` or `minItemSize` argument.

```typescript
function resolveIndexes(params: {
  scrollTop: number;
  viewHeight: number;
  itemSize: number;
  totalItems: number;
  itemBuffer: number;
  dynamicSizes?: { [index: string]: number };  // default {}
}): {
  startIndex: number;
  endIndex: number;
  totalItemHeight: number;
  scrollTopPadding: number;
}
```

### `utils.fillAndFlattenDatasets`

Builds a dense `endIndex - startIndex + 1` array for the visible window, pulling items out of the
provided datasets. Positions with no loaded data are `null`.

```typescript
function fillAndFlattenDatasets(params: {
  orderedDatasets: Dataset[];
  startIndex: number;
  endIndex: number;
}): Array<any | null>
```

### `utils.flattenDatasets`

Flattens datasets into a flat list of `{ itemIndex, itemData }` pairs.
With `sortFirst` on (the default) the `datasets` array is sorted **in place**.

```typescript
function flattenDatasets<T = unknown>(
  datasets: Dataset<T>[],
  sortFirst?: boolean,   // default true
): Array<{ itemIndex: number; itemData: T }>
```

### `utils.splitLoadEventBasedOnAlreadyLoaded`

Splits a requested range into the sub-ranges that are not loaded yet, so you only fetch what is missing.
Note: if every index in the range is already loaded, it returns the original range unsplit (`[event]`)
rather than an empty array.

```typescript
function splitLoadEventBasedOnAlreadyLoaded(
  event: LoadEventPayload,
  isLoaded: (itemIndex: number) => boolean,
): LoadEventPayload[]
```

### `utils.indexIsLoaded`

Returns whether an index is covered by any of the datasets.

```typescript
function indexIsLoaded(itemIndex: number, datasets: Dataset[]): boolean
```

### `utils.mergeAdjacentDatasets`

Merges datasets whose ranges touch or overlap into a smaller set of contiguous datasets.
With `sortFirst` on (the default) the `datasets` array is sorted **in place**.

```typescript
function mergeAdjacentDatasets(
  datasets: Dataset[],
  sortFirst?: boolean,   // default true
): Dataset[]
```

### `utils.scrollOuterStyle` / `utils.scrollInnerStyle`

Build the inline style objects the React and Vue components apply to their scroll containers.

```typescript
function scrollOuterStyle(lengthProp: 'width' | 'height', overrides?: any): object

function scrollInnerStyle(
  scrollLength: number,
  scrollMargin: number,
  flexDirection: 'row' | 'column',
  overrides?: any,
): object
```

### `utils.capitalize`

```typescript
function capitalize(v: string): string
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

Not every field is wired up in both frameworks. `scrollOuterStyleOverrides` and
`scrollInnerStyleOverrides` are React-only; the Vue component exposes
`outerLengthCssValue` / `outerMinLengthCssValue` / `outerMaxLengthCssValue` / `listItemStyle`
instead. See each package's README for the authoritative prop list.

### defaultScrollProps

A convenience constant of suggested starting values. **These are the demo's defaults, not the
component defaults** — the React and Vue components each declare their own defaults (notably
`scrollDebounce: 0` and `autoDetectSizes: false`), so passing `defaultScrollProps` in explicitly
is the only way to get these values.

```typescript
const defaultScrollProps: Omit<ScrollProps, 'totalItems'> = {
  itemSize: 65,
  itemBuffer: 3,
  scrollStart: 0,
  scrollThrottle: 0,
  scrollDebounce: 100,
  minItemSize: 0,
  autoDetectSizes: true,
  direction: 'column',
  sortDatasets: true,
};
```

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

## Data Subsystem

Everything above is stateless: the components compute indexes and the consumer
owns the rows. The `data/` subsystem is the opt-in counterpart that owns a row
cache, so rows can be loaded without being rendered and read back
asynchronously. It is framework-agnostic; the React and Vue packages only add
thin lifecycle bindings (`useLazyDataSource`).

### `createLazyDataSource`

The public facade. See the
[React](../react-lazy-virtual-scroll/README.md#background-loading--data-access)
or [Vue](../vue-lazy-virtual-scroll/README.md#background-loading--data-access)
README for usage; this section covers the internals.

```typescript
function createLazyDataSource<T>(options: {
  totalItems: number;
  fetchRange: (startIndex: number, endIndex: number) => Promise<T[]> | T[];
  useIndexedDb?: boolean | { dbName?: string; storeName?: string };
  batchSize?: number;
  background?: boolean | BackgroundOptions;
}): LazyDataSource<T>
```

It composes three independently testable pieces:

| Piece | Responsibility |
|-------|----------------|
| `LoadedRanges` | Which indexes are cached, as a merged interval set |
| `RowStore` | Where rows live (`MemoryRowStore` or `IndexedDbRowStore`) |
| `BatchScanner` | Pacing, concurrency, pausing and retries for background work |

The source itself only owns request de-duplication and gap-splitting: it
decides what to fetch, never how to store it or when to run it.

### `RowStore` and the hot window

`RowStore` is the storage boundary. Every read and write returns a promise
regardless of backend — "async parity" — so a consumer never branches on where
the bytes live and swapping backends is a config change.

Two members are deliberately synchronous. Rendering happens inside a Vue
`computed` / React `useMemo`, so the visible window has to be readable without
awaiting or the list flashes empty on every scroll tick. Implementations
therefore keep a **hot window** — the visible range plus `itemBuffer`, and
nothing else — resident in a plain `Map`:

```typescript
peek(startIndex: number, endIndex: number): Array<T | undefined>;  // sync
has(index: number): boolean;                                       // sync
setHotWindow(startIndex: number, endIndex: number): Promise<void>;
```

With `MemoryRowStore` every cached row is resident, so `peek` can serve
anything. With `IndexedDbRowStore` only the hot window is resident; everything
else lives in IndexedDB and is reachable solely through the async methods. That
is what keeps memory at `O(visible + buffer)` while the cache holds the whole
list.

Both implementations run against one shared conformance suite
(`row-store.conformance.ts`), so parity is enforced by tests rather than by
discipline. Add a backend by implementing `RowStore` and registering it there.

`IndexedDbRowStore` is session-scoped: the database is wiped on open and
deleted on dispose, which is why there is no version key or TTL. `createRowStore`
falls back to memory when IndexedDB is missing or fails to open.

### `LoadedRanges`

A sorted, non-overlapping interval set over row indexes. Loads are always
range-shaped, so intervals stay tiny (a handful of entries rather than one byte
per row) while still answering membership and gap queries synchronously — which
is what lets the scheduler pick its next batch without awaiting.

```typescript
class LoadedRanges {
  add(startIndex: number, endIndex: number): void;
  remove(startIndex: number, endIndex: number): void;
  has(index: number): boolean;                                  // binary search
  missingWithin(startIndex: number, endIndex: number): Range[]; // gaps to fetch
  firstMissing(from: number, to: number): number | null;
  count(): number;
  clear(): void;
  toArray(): Range[];
}
```

### `createBatchScanner`

Walks an index space in batches off the critical path. It knows nothing about
stores or fetching — it is handed `nextRange` and `process` and owns only
pacing, concurrency, pausing and retries.

```typescript
function createBatchScanner(options: {
  totalItems: number;
  concurrency?: number;
  maxRetries?: number;
  batchSizeHint?: number;
  nextRange: () => Range | null;
  process: (range: Range) => Promise<void>;
  schedule?: (cb: () => void) => void;
  onProgress?: (progress: ScanProgress) => void;
  onError?: (error: unknown, range: Range) => void;
}): BatchScanner
```

`schedule` defaults to `requestIdleCallback` (with a `setTimeout` fallback for
Safari and non-browser hosts), which is what lets a scan run during scrolling
without competing with the scroll handler. It is injectable so tests need no
fake clock.

Viewport work preempts the scan implicitly: ranges the viewport has already
claimed simply never come back from `nextRange`.

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
