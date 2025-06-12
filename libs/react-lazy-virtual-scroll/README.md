 # React Lazy Virtual Scroll

[![npm version](https://img.shields.io/npm/v/@lazy-virtual-scroll/react.svg)](https://www.npmjs.com/package/@lazy-virtual-scroll/react)
[![License: MIT](https://img.shields.io/badge/License-MIT## Running unit tests

Run `nx test @lazy-virtual-scroll/react` to execute the unit tests via [Vitest](https://vitest.dev()).ue.svg)](https://opensource.org/licenses/MIT)

A highly performant virtualized list component for React that efficiently renders large datasets with dynamic sizing, lazy loading, and bi-directional scrolling support.

## Features

- **Virtualized Rendering**: Only renders the items currently visible in the viewport
- **Dynamic Sizing**: Automatically detects and handles items of varying heights
- **Lazy Loading**: Load data on-demand as the user scrolls
- **Bi-directional Scrolling**: Vertical and horizontal scrolling support
- **Performance Optimized**: Debounced and throttled scroll handling
- **Flexible Data Structure**: Support for continuous or fragmented datasets
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

## Basic Usage

```jsx
import React, { useState } from 'react';
import LazyVirtualList from '@lazy-virtual-scroll/react';

const MyList = () => {
  const [items] = useState(Array.from({ length: 10000 }, (_, i) => ({ 
    id: i, 
    text: `Item ${i}` 
  })));

  return (
    <div style={{ height: '500px', width: '100%' }}>
      <LazyVirtualList
        totalItems={items.length}
        itemSize={50}
        data={items}
        onLoad={({ startIndex, endIndex }) => {
          console.log(`Loading items from ${startIndex} to ${endIndex}`);
        }}
        render={(index, item) => (
          <div style={{ height: '50px', padding: '10px', borderBottom: '1px solid #eee' }}>
            {item ? item.text : 'Loading...'}
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
import LazyVirtualList from 'react-lazy-virtual-scroll';

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
      <LazyVirtualList
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

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `totalItems` | `number` | *(required)* | Total number of items in the list |
| `itemSize` | `number` | *(required)* | Base height/width of each item in pixels |
| `data` | `any[]` | `[]` | Array of data items to render |
| `datasets` | `Dataset[]` | `[]` | Alternative to `data` for fragmented datasets |
| `render` | `(index: number, item: any) => ReactNode` | *(required)* | Function to render each item |
| `renderLoading` | `(index: number) => ReactNode` | `undefined` | Function to render loading state |
| `direction` | `'row' \| 'column'` | `'column'` | Scroll direction |
| `itemBuffer` | `number` | `3` | Number of items to render outside visible area |
| `scrollThrottle` | `number` | `0` | Throttle scroll events (milliseconds) |
| `scrollDebounce` | `number` | `0` | Debounce scroll events (milliseconds) |
| `scrollStart` | `number` | `0` | Initial scroll position |
| `dynamicSizes` | `{ [itemIndex: string]: number }` | `{}` | Manual size overrides for specific items |
| `autoDetectSizes` | `boolean` | `false` | Automatically detect item sizes |
| `minItemSize` | `number` | `0` | Minimum size for dynamically sized items |
| `sortDatasets` | `boolean` | `true` | Automatically sort datasets by startingIndex |
| `onLoad` | `(range: { startIndex: number; endIndex: number }) => void` | `undefined` | Callback when visible range changes |
| `onScroll` | `(value: number) => void` | `undefined` | Callback on scroll |
| `className` | `string` | `''` | Additional class name for the outer container |

## Working with Fragmented Datasets

For scenarios where your data is loaded in chunks or comes from different sources, you can use the `datasets` prop instead of `data`:

```jsx
const datasets = [
  { startingIndex: 0, data: [{id: 0, text: 'Item 0'}, {id: 1, text: 'Item 1'}, /* ... */] },
  { startingIndex: 100, data: [{id: 100, text: 'Item 100'}, /* ... */] },
  // More dataset chunks...
];

<LazyVirtualList
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
   
   <LazyVirtualList
     dynamicSizes={dynamicSizes}
     // ...other props
   />
   ```

2. **Automatic Size Detection**:
   ```jsx
   <LazyVirtualList
     autoDetectSizes={true}
     // ...other props
   />
   ```

## Performance Optimization

For optimal performance with large lists:

1. Use both `scrollThrottle` and `scrollDebounce` to limit scroll event processing:
   ```jsx
   <LazyVirtualList
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
   
   <LazyVirtualList
     // ...
     render={(index, item) => <MemoizedItem data={item} />}
   />
   ```

## Running unit tests

Run `nx test react-lazy-virtual-scroll` to execute the unit tests via [Vitest](https://vitest.dev/).

## License

MIT
