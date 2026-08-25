# React Lazy Virtual Scroll

[![npm version](https://img.shields.io/npm/v/@lazy-virtual-scroll/react.svg)](https://www.npmjs.com/package/@lazy-virtual-scroll/react)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A highly performant virtualized list component for React that efficiently renders large datasets with dynamic sizing, lazy loading, and bi-directional scrolling support.

## Features

- **Virtualized Rendering**: Only renders the items currently visible in the viewport
- **Dynamic Sizing**: Automatically detects and handles items of varying heights
- **Lazy Loading**: Load data on-demand as the user scrolls
- **Bi-directional Scrolling**: Vertical and horizontal scrolling support
- **Performance Optimized**: Debounced and throttled scroll handling
- **Flexible Data Structure**: Support for continuous or fragmented datasets
- **Background Loading**: Optionally cache the whole list off the critical path and query it asynchronously, with IndexedDB storage so it never has to sit in memory
- **Typescript Support**: Full type definitions included

## Installation

```bash
# npm
npm install @lazy-virtual-scroll/react

# yarn
yarn add @lazy-virtual-scroll/react

# pnpm
pnpm add @lazy-virtual-scroll/react
```

## Imports

```jsx
// default export, or the equivalent named export
import LazyVirtualScroll from '@lazy-virtual-scroll/react';
import { LazyVirtualScroll } from '@lazy-virtual-scroll/react';

// prop type, plus the core types and helpers, which this package re-exports
import type { VirtualLazyScrollProps, Dataset, LoadEventPayload, ScrollProps } from '@lazy-virtual-scroll/react';
import { resolveIndexes, defaultScrollProps, utils } from '@lazy-virtual-scroll/react';
```

## Basic Usage

```jsx
import React, { useState } from 'react';
import LazyVirtualScroll from '@lazy-virtual-scroll/react';

const MyList = () => {
  const [items] = useState(Array.from({ length: 10000 }, (_, i) => ({ 
    id: i, 
    text: `Item ${i}` 
  })));

  return (
    <div style={{ height: '500px', width: '100%' }}>
      <LazyVirtualScroll
        totalItems={items.length}
        itemSize={70}
        data={items}
        onLoad={({ startIndex, endIndex }) => {
          console.log(`Loading items from ${startIndex} to ${endIndex}`);
        }}
        onHide={({ startIndex, endIndex }) => {
          console.log(`Hiding items from ${startIndex} to ${endIndex}`);
        }}
        render={(index, item) => (
          <div style={{ 
            height: '50px', 
            padding: '10px', 
            borderBottom: '1px solid #eee',
            boxSizing: 'border-box' // Ensures padding is included in height
          }}>
            {item.text}
          </div>
        )}
        renderLoading={(index) => (
          <div style={{ 
            height: '50px', 
            padding: '10px', 
            borderBottom: '1px solid #eee', 
            backgroundColor: '#f5f5f5',
            boxSizing: 'border-box' // Ensures padding is included in height
          }}>
            Loading item {index}...
          </div>
        )}
      />
    </div>
  );
};
```

## Advanced Example

```jsx
import React, { useState } from 'react';
import LazyVirtualScroll from '@lazy-virtual-scroll/react';

const AdvancedExample = () => {
  const [items] = useState(Array.from({ length: 10000 }, (_, i) => ({ 
    id: i, 
    text: `Item ${i}`,
    expanded: false
  })));
  
  const [expandedItems, setExpandedItems] = useState({});
  
  const toggleExpand = (index) => {
    setExpandedItems(prev => {
      const newState = { ...prev };
      if (newState[index]) {
        delete newState[index];
      } else {
        newState[index] = 300; // expanded height
      }
      return newState;
    });
  };
  
  return (
    <div style={{ height: '500px', width: '100%' }}>
      <LazyVirtualScroll
        totalItems={items.length}
        itemSize={50}
        data={items}
        autoDetectSizes={true}
        dynamicSizes={expandedItems}
        scrollDebounce={100}
        direction="column"
        onLoad={({ startIndex, endIndex }) => {
          // You could fetch data here if needed
          console.log(`Visible range: ${startIndex} - ${endIndex}`);
        }}
        onHide={({ startIndex, endIndex }) => {
          // Clean up or unload data when items go out of view
          console.log(`Hidden range: ${startIndex} - ${endIndex}`);
        }}
        render={(index, item) => (
          <div 
            className={expandedItems[index] ? 'expanded-item' : 'item'}
            onClick={() => toggleExpand(index)}
          >
            <div className="item-header">
              {item.text}
              <span>{expandedItems[index] ? '▲' : '▼'}</span>
            </div>
            
            {expandedItems[index] && (
              <div className="item-content" style={{ height: `${expandedItems[index]}px` }}>
                <p>Expanded content for item {index}</p>
              </div>
            )}
          </div>
        )}
        renderLoading={(index) => (
          <div className="loading-item">
            Loading item {index}...
          </div>
        )}
      />
    </div>
  );
};
```

## Rendering

### Item Rendering with `render`

The `render` prop is a required function that determines how each item is displayed:

```jsx
<LazyVirtualScroll
  // ...other props
  render={(index, item) => (
    <div className="list-item">
      <h3>Item {index}</h3>
      {item ? (
        <p>{item.content}</p>
      ) : (
        <p>Data not loaded yet</p>
      )}
    </div>
  )}
/>
```

**Parameters:**
- `index` (number): The index of the item in the list
- `item` (any): The data item from your `data` array or `datasets`. Will be `undefined` if data hasn't been loaded yet.

### Loading State with `renderLoading`

The optional `renderLoading` prop lets you customize the loading state for items that haven't been loaded yet:

```jsx
<LazyVirtualScroll
  // ...other props
  renderLoading={(index) => (
    <div className="loading-item">
      <div className="spinner"></div>
      <span>Loading item {index}...</span>
    </div>
  )}
/>
```

**Parameters:**
- `index` (number): The index of the loading item

If `renderLoading` is not provided, the `render` function will be called with `item` as `undefined`.

## Callbacks

### `onLoad` Callback

Called when new items become visible and need to be loaded:

```jsx
const handleLoad = ({ startIndex, endIndex }) => {
  console.log(`Need to load items from ${startIndex} to ${endIndex}`);
  
  // Example: Fetch data for this range
  fetchData(startIndex, endIndex).then(newData => {
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      newData.forEach((item, i) => {
        updatedItems[startIndex + i] = item;
      });
      return updatedItems;
    });
  });
};

<LazyVirtualScroll onLoad={handleLoad} /* ...other props */ />
```

### `onHide` Callback

Called when items go out of view:

```jsx
const handleHide = ({ startIndex, endIndex }) => {
  console.log(`Items ${startIndex} to ${endIndex} are now hidden`);
  
  // Example: Clean up resources or mark items for garbage collection
  cleanupItems(startIndex, endIndex);
};

<LazyVirtualScroll onHide={handleHide} /* ...other props */ />
```

### `onScroll` Callback

Called when the user scrolls:

```jsx
const handleScroll = (scrollPosition) => {
  console.log(`Current scroll position: ${scrollPosition}px`);
  
  // Example: Update URL or save scroll position
  updateScrollPosition(scrollPosition);
};

<LazyVirtualScroll onScroll={handleScroll} /* ...other props */ />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `totalItems` | `number` | *(required)* | Total number of items in the list |
| `itemSize` | `number` | *(required)* | Base height/width of each item in pixels |
| `data` | `any[]` | `undefined` | Array of data items to render. Ignored when `datasets` is supplied. |
| `datasets` | `Dataset[]` | `undefined` | Alternative to `data` for fragmented datasets |
| `render` | `(index: number, datum: any) => ReactNode` | *(required)* | Function to render each item |
| `renderLoading` | `(index: number) => ReactNode` | `undefined` | Function to render loading state |
| `direction` | `'row' \| 'column'` | `'column'` | Scroll direction |
| `itemBuffer` | `number` | `3` | Number of items to render outside visible area |
| `scrollThrottle` | `number` | `0` | Throttle scroll events (milliseconds) |
| `scrollDebounce` | `number` | `0` | Debounce scroll events (milliseconds) |
| `scrollStart` | `number` | `0` | Initial scroll position |
| `dynamicSizes` | `{ [itemIndex: string]: number }` | `{}` | Manual size overrides for specific items |
| `autoDetectSizes` | `boolean` | `false` | Automatically detect item sizes |
| `minItemSize` | `number` | `0` | Floor applied to measured sizes when `autoDetectSizes` is on |
| `sortDatasets` | `boolean` | `true` | Automatically sort datasets by startingIndex |
| `scrollOuterStyleOverrides` | `React.CSSProperties` | `{}` | Custom styles for the outer scroll container |
| `scrollInnerStyleOverrides` | `React.CSSProperties` | `{}` | Custom styles for the inner scroll container |
| `className` | `string` | `undefined` | Appended to the outer container's `scroll-outer` class |
| `source` | `LazyDataSource<T>` | `undefined` | Opt-in data source (see [Background Loading & Data Access](#background-loading--data-access)). Replaces `data`/`datasets` |

## Callback Reference

| Callback | Type | Description |
|----------|------|-------------|
| `onLoad` | `(range: { startIndex: number; endIndex: number }) => void` | Called when new items become visible and need to be loaded |
| `onHide` | `(range: { startIndex: number; endIndex: number }) => void` | Called when items go out of view and are hidden |
| `onScroll` | `(value: number) => void` | Called on scroll with current scroll position |

## Callback Examples

### Using onLoad and onHide for Data Management

```jsx
import React, { useState, useCallback } from 'react';
import LazyVirtualScroll from '@lazy-virtual-scroll/react';

const DataManagedList = () => {
  const [loadedRanges, setLoadedRanges] = useState(new Set());
  const [hiddenRanges, setHiddenRanges] = useState(new Set());
  
  const handleLoad = useCallback(({ startIndex, endIndex }) => {
    console.log(`Loading items ${startIndex} to ${endIndex}`);
    
    // Track loaded ranges
    const rangeKey = `${startIndex}-${endIndex}`;
    setLoadedRanges(prev => new Set([...prev, rangeKey]));
    
    // Simulate async data loading
    setTimeout(() => {
      console.log(`Loaded items ${startIndex} to ${endIndex}`);
    }, 100);
  }, []);
  
  const handleHide = useCallback(({ startIndex, endIndex }) => {
    console.log(`Hiding items ${startIndex} to ${endIndex}`);
    
    // Track hidden ranges for cleanup
    const rangeKey = `${startIndex}-${endIndex}`;
    setHiddenRanges(prev => new Set([...prev, rangeKey]));
    
    // Optional: Clean up data that's no longer visible
    // This can help with memory management for large datasets
  }, []);
  
  const handleScroll = useCallback((scrollPosition) => {
    console.log(`Scrolled to position: ${scrollPosition}`);
  }, []);
  
  return (
    <LazyVirtualScroll
      totalItems={100000}
      itemSize={60}
      onLoad={handleLoad}
      onHide={handleHide}
      onScroll={handleScroll}
      render={(index, item) => (
        <div style={{ 
          height: '60px', 
          padding: '10px',
          boxSizing: 'border-box' // Ensures padding is included in height
        }}>
          Item {index} {item ? `- ${item.text}` : '(Loading...)'}
        </div>
      )}
      renderLoading={(index) => (
        <div style={{ 
          height: '60px', 
          padding: '10px', 
          opacity: 0.6,
          boxSizing: 'border-box' // Ensures padding is included in height
        }}>
          Loading item {index}...
        </div>
      )}
    />
  );
};
```

## Background Loading & Data Access

By default the list is a pure view: you hold the rows and hand them in through
`data`/`datasets`, and `onLoad` tells you when to fetch more. That renders
well, but it leaves you with no way to reach a row nobody has scrolled to yet —
so search, export or "select all" end up loading the whole list into memory.

`useLazyDataSource` inverts that. You give it one `fetchRange` function and it
owns a row cache that:

- fills the viewport as you scroll (replacing the fetch in your `onLoad`),
- can walk the **entire** list in the background, off the critical path —
  exactly as if every row were scrolling into view, but rendering nothing, and
- exposes that cache through an **async API** usable anywhere in your app.

It is entirely opt-in. Without a `source` prop the component behaves exactly as
it always has.

### Quick start

```tsx
import LazyVirtualScroll, { useLazyDataSource } from '@lazy-virtual-scroll/react';

const UserList = () => {
  const source = useLazyDataSource<User>({
    totalItems: 100000,
    // Called for every range the viewport, a background scan or getRange() needs.
    fetchRange: async (startIndex, endIndex) => {
      const res = await fetch(`/api/users?from=${startIndex}&to=${endIndex}`);
      return res.json(); // must resolve exactly (endIndex - startIndex + 1) rows
    },
  });

  return (
    <LazyVirtualScroll
      totalItems={100000}
      itemSize={50}
      source={source}
      render={(index, user) => <div>{user.name}</div>}
      renderLoading={(index) => <div>Loading {index}…</div>}
    />
  );
};
```

With `source` set you no longer pass `data`/`datasets` and no longer fetch
inside `onLoad`: the list reports its viewport to the source and the source
does the rest. `onLoad`, `onHide` and `onScroll` still fire, so existing
listeners keep working.

### Migrating an existing list

Your current `onLoad` handler already contains `fetchRange`. Move the fetch out
of it and drop the "have I already loaded this?" bookkeeping — the source
tracks loaded ranges itself and never fetches the same row twice.

```diff
-const [datasets, setDatasets] = useState<Dataset[]>([]);
-
-const handleLoad = ({ startIndex, endIndex }) => {
-  const alreadyLoaded = datasets.some(/* ...range check... */);
-  if (alreadyLoaded) return;
-  loadUsers(startIndex, endIndex - startIndex + 1)
-    .then((d) => setDatasets((prev) => [...prev, d]));
-};
+const source = useLazyDataSource<User>({
+  totalItems,
+  fetchRange: (startIndex, endIndex) =>
+    loadUsers(startIndex, endIndex - startIndex + 1),
+});

 <LazyVirtualScroll
-  datasets={datasets}
-  onLoad={handleLoad}
+  source={source}
   /* ...unchanged props... */
 />
```

### Background batch processing

Set `background` to walk the whole list without rendering it. Batches are
scheduled through `requestIdleCallback`, so the scan yields to scrolling rather
than competing with it, and any range the viewport already pulled in is
skipped.

```tsx
const source = useLazyDataSource<User>({
  totalItems: 100000,
  fetchRange,
  background: {
    batchSize: 200,   // rows per request
    concurrency: 1,   // requests in flight; keep low so the viewport wins
    autoStart: true,  // begin as soon as the source is ready
  },
});
```

Leave `autoStart` off to drive it yourself — for example, only once the user
opens a search box:

```tsx
source.startBackground();
source.pauseBackground();
source.resumeBackground();
source.stopBackground();

await source.whenBackgroundIdle(); // resolves when the scan finishes
```

Progress is readable at any time, and `useLazyDataSourceVersion` re-renders a
component whenever the cache changes:

```tsx
const IndexingProgress = ({ source }: { source: LazyDataSource<User> }) => {
  useLazyDataSourceVersion(source); // re-render as rows land
  const { loadedCount, totalItems } = source.stats();
  return <span>Indexed {loadedCount} / {totalItems}</span>;
};
```

Because `background` means fetching your entire list, it is **off by default**.

### Reading data outside the list

Everything shares one cache, so a row pulled in by the background scan is
already there when it scrolls into view, and vice versa.

```tsx
const user = await source.getItem(4200);
const page = await source.getRange(0, 99);
await source.prefetch(500, 599);   // warm the cache without reading it back
```

For anything that has to look at every row, use `scan()`. It is an async
iterator, so you only ever hold one batch at a time — this is what lets you
search a 100k-row list without materialising it:

```tsx
const search = async (term: string) => {
  const hits: number[] = [];
  for await (const { startIndex, rows } of source.scan({ batchSize: 500 })) {
    rows.forEach((row, i) => {
      if (row?.name.toLowerCase().includes(term)) hits.push(startIndex + i);
    });
  }
  return hits;
};
```

When your data changes underneath the cache, drop it and let it refill:

```tsx
await source.invalidate(100, 199); // one range
await source.invalidate();         // everything
```

### Storing rows in IndexedDB

A full background scan of a large list is a lot of rows to keep on the heap.
Set `useIndexedDb` and they are spilled to IndexedDB instead: only the visible
range plus `itemBuffer` stays in memory, and everything else is reachable
through the same async API.

```tsx
const source = useLazyDataSource<User>({
  totalItems: 1000000,
  fetchRange,
  useIndexedDb: true,          // or { dbName: 'users' }
  background: { autoStart: true },
});
```

Nothing else in your code changes. Every method on the source is async
whichever backend is in use, so switching is a one-line change — and if
IndexedDB is unavailable (server-side rendering, Safari private browsing) the
source logs a warning and falls back to memory on its own.

The database is **session-scoped**: it is wiped when the source is created and
deleted when it is disposed. It is a cache that happens to live outside the
heap, not a persistence layer, so there is no version key or staleness contract
to get wrong.

```tsx
const { loadedCount, residentCount } = source.stats();
// loadedCount   -> rows cached, in memory or in IndexedDB
// residentCount -> rows actually on the heap right now
```

### `useLazyDataSource(options)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `totalItems` | `number` | *(required)* | Number of rows in the list |
| `fetchRange` | `(startIndex, endIndex) => Promise<T[]> \| T[]` | *(required)* | Resolves an inclusive range; must return exactly `endIndex - startIndex + 1` rows |
| `useIndexedDb` | `boolean \| { dbName?, storeName? }` | `false` | Spill rows to IndexedDB instead of the heap |
| `batchSize` | `number` | `50` | Rows per batch for `scan()` and, by default, the background scan |
| `background` | `boolean \| BackgroundOptions` | `false` | Background scan configuration |

`BackgroundOptions`: `{ batchSize?, concurrency?, maxRetries?, autoStart? }`.

### `LazyDataSource` methods

| Method | Description |
|--------|-------------|
| `getItem(index)` | Resolve a single row, fetching it if needed |
| `getRange(start, end)` | Resolve an inclusive range, fetching only the gaps |
| `prefetch(start, end)` | Warm a range without reading it back |
| `scan(options?)` | Async iterator over the list in batches |
| `peek(start, end)` | **Synchronous** read of resident rows — used by the render path |
| `has(index)` | **Synchronous** check for whether a row is cached |
| `invalidate(start?, end?)` | Drop a range, or everything |
| `setTotalItems(n)` | Tell the source the list length changed |
| `stats()` | `{ loadedCount, residentCount, totalItems, background }` |
| `startBackground()` / `pauseBackground()` / `resumeBackground()` / `stopBackground()` | Control the background scan |
| `whenBackgroundIdle()` | Resolves when the background scan finishes |
| `subscribe(fn)` | Change notification; returns an unsubscribe function |
| `on(event, fn)` | `'rangeLoaded'`, `'progress'` or `'error'`; returns an unsubscribe function |
| `isDisposed()` | Whether `dispose()` has run |
| `dispose()` | Stop the scan and release the store |

Concurrent callers are deduplicated: if the viewport, a background batch and a
`getRange()` all want the same rows, one request is made and everyone waits on
it.

### Error handling

`getItem`, `getRange`, `prefetch` and `scan` reject if `fetchRange` throws, and
the failed range is left uncached so the next attempt retries it. Failures the
list triggers on its own — the viewport and background batches — have nobody to
reject to, so they are reported through the `error` event instead:

```tsx
useEffect(() => source.on('error', ({ error, range }) => {
  console.error('failed to load', range, error);
}), [source]);
```

## Working with Fragmented Datasets

For scenarios where your data is loaded in chunks or comes from different sources, you can use the `datasets` prop instead of `data`:

```jsx
const datasets = [
  { startingIndex: 0, data: [{id: 0, text: 'Item 0'}, {id: 1, text: 'Item 1'}, /* ... */] },
  { startingIndex: 100, data: [{id: 100, text: 'Item 100'}, /* ... */] },
  // More dataset chunks...
];

<LazyVirtualScroll
  datasets={datasets}
  totalItems={10000}
  itemSize={50}
  // ...other props
/>
```

## Dynamic Sizing

The component supports dynamic item sizes in two ways:

1. **Manual Size Specification**:
   ```jsx
   const dynamicSizes = {
     5: 100,  // Item at index 5 has height 100px
     10: 200, // Item at index 10 has height 200px
   };
   
   <LazyVirtualScroll
     dynamicSizes={dynamicSizes}
     // ...other props
   />
   ```

2. **Automatic Size Detection**:
   ```jsx
   <LazyVirtualScroll
     autoDetectSizes={true}
     // ...other props
   />
   ```

## Performance Optimization

For optimal performance with large lists:

1. Use both `scrollThrottle` and `scrollDebounce` to limit scroll event processing:
   ```jsx
   <LazyVirtualScroll
     scrollThrottle={16}  // ~60fps
     scrollDebounce={100} // Final update after scrolling stops
     // ...other props
   />
   ```

2. Implement item memoization to prevent unnecessary renders:
   ```jsx
   const MemoizedItem = React.memo(({ data }) => (
     <div>{data.text}</div>
   ));
   
   <LazyVirtualScroll
     // ...
     render={(index, item) => <MemoizedItem data={item} />}
   />
   ```

## Running unit tests

Run `nx test @lazy-virtual-scroll/react` to execute the unit tests via [Vitest](https://vitest.dev/).

## License

MIT
