# Vue Lazy Virtual Scroll

[![npm version](https://img.shields.io/npm/v/@lazy-virt## Advanced Usage with Dynamic Sizing

```vue
<template>
  <div style="height: 500px; width: 100%">
    <LazyVirtualList
      :totalItems="items.length"
      :itemSize="50"
      :data="items"
      :autoDetectSizes="true"
      :dynamicSizes="expandedItems"
      :scrollDebounce="100"
      direction="column"
      @load="handleLoad"
    >svg)](https://www.npmjs.com/package/@lazy-virtual-scroll/vue)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A high-performance virtualized list component for Vue 3 that efficiently renders large datasets with dynamic sizing, lazy loading, and bi-directional scrolling support.

## Features

- **Virtualized Rendering**: Only renders items currently visible in the viewport
- **Dynamic Sizing**: Automatically detects and handles items of varying heights
- **Lazy Loading**: Load data on-demand as the user scrolls
- **Bi-directional Scrolling**: Support for both vertical and horizontal scrolling
- **Performance Optimized**: Debounced and throttled scroll handling
- **Flexible Data Structure**: Support for continuous or fragmented datasets
- **TypeScript Support**: Full type definitions included

## Installation

```bash
# npm
npm install @lazy-virtual-scroll/vue

# yarn
yarn add @lazy-virtual-scroll/vue

# pnpm
pnpm add @lazy-virtual-scroll/vue
```

## Basic Usage

```vue
<template>
  <div style="height: 500px; width: 100%">
    <LazyVirtualList
      :totalItems="items.length"
      :itemSize="50"
      :data="items"
      @load="handleLoad"
      @hide="handleHide"
    >
      <template #default="{ item, index }">
        <div class="item">
          {{ item.text }}
        </div>
      </template>
      <template #loading="{ index }">
        <div class="item loading">
          Loading item {{ index }}...
        </div>
      </template>
    </LazyVirtualList>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import LazyVirtualList from 'vue-lazy-virtual-scroll';

const items = ref(Array.from({ length: 10000 }, (_, i) => ({ 
  id: i, 
  text: `Item ${i}` 
})));

## Basic Usage

```vue
<template>
  <div style="height: 500px; width: 100%">
    <LazyVirtualList
      :totalItems="items.length"
      :itemSize="50"
      :data="items"
      @load="handleLoad"
      @hide="handleHide"
    >
      <template #default="{ item, index }">
        <div class="item">
          {{ item ? item.text : 'Loading...' }}
        </div>
      </template>
      <template #loading="{ index }">
        <div class="item loading">
          Loading item {{ index }}...
        </div>
      </template>
    </LazyVirtualList>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import LazyVirtualList from '@lazy-virtual-scroll/vue';

const items = ref(Array.from({ length: 10000 }, (_, i) => ({ 
  id: i, 
  text: `Item ${i}` 
})));

const handleLoad = ({ startIndex, endIndex }) => {
  console.log(`Loading items from ${startIndex} to ${endIndex}`);
};

const handleHide = ({ startIndex, endIndex }) => {
  console.log(`Hiding items from ${startIndex} to ${endIndex}`);
};
</script>

<style>
.item {
  height: 50px;
  padding: 10px;
  border-bottom: 1px solid #eee;
  box-sizing: border-box; /* Ensures padding is included in height */
}
.item.loading {
  background-color: #f5f5f5;
  color: #999;
}
</style>
```

## Slots

### Default Slot (`#default`)

The default slot is used to render each item in the list:

```vue
<LazyVirtualList :totalItems="1000" :itemSize="60">
  <template #default="{ item, index }">
    <div class="list-item">
      <h3>Item {{ index }}</h3>
      <p>{{ item.content }}</p>
    </div>
  </template>
</LazyVirtualList>
```

**Slot Props:**
- `item` (any): The data item from your `data` array or `datasets`. Will be `undefined` if data hasn't been loaded yet.
- `index` (number): The index of the item in the list

### Loading Slot (`#loading`)

The loading slot is used to render items that are still loading:

```vue
<LazyVirtualList :totalItems="1000" :itemSize="60">
  <template #default="{ item, index }">
    <!-- Regular item content -->
    <div class="list-item">{{ item.content }}</div>
  </template>
  
  <template #loading="{ index }">
    <div class="loading-item">
      <div class="spinner"></div>
      <span>Loading item {{ index }}...</span>
    </div>
  </template>
</LazyVirtualList>
```

**Slot Props:**
- `index` (number): The index of the loading item

If the `#loading` slot is not provided, the `#default` slot will be used with `item` as `undefined`.

## Events

### `@load` Event

Emitted when new items become visible and need to be loaded:

```vue
<template>
  <LazyVirtualList @load="handleLoad" />
</template>

<script setup>
const handleLoad = ({ startIndex, endIndex }) => {
  console.log(`Need to load items from ${startIndex} to ${endIndex}`);
  
  // Example: Fetch data for this range
  fetchData(startIndex, endIndex).then(newData => {
    // Update your reactive data
    newData.forEach((item, i) => {
      items.value[startIndex + i] = item;
    });
  });
};
</script>
```

**Payload:**
- `startIndex` (number): First index that needs to be loaded
- `endIndex` (number): Last index that needs to be loaded

### `@hide` Event

Emitted when items go out of view:

```vue
<template>
  <LazyVirtualList @hide="handleHide" />
</template>

<script setup>
const handleHide = ({ startIndex, endIndex }) => {
  console.log(`Items ${startIndex} to ${endIndex} are now hidden`);
  
  // Example: Clean up resources or mark items for garbage collection
  cleanupItems(startIndex, endIndex);
};
</script>
```

**Payload:**
- `startIndex` (number): First index that is now hidden
- `endIndex` (number): Last index that is now hidden

### `@scroll` Event

Emitted when the user scrolls:

```vue
<template>
  <LazyVirtualList @scroll="handleScroll" />
</template>

<script setup>
const handleScroll = (scrollPosition) => {
  console.log(`Current scroll position: ${scrollPosition}px`);
  
  // Example: Update URL or save scroll position
  updateScrollPosition(scrollPosition);
};
</script>
```

**Payload:**
- `scrollPosition` (number): Current scroll position in pixels

## Advanced Example

```vue
<template>
  <div style="height: 500px; width: 100%">
    <LazyVirtualList
      :totalItems="items.length"
      :itemSize="50"
      :data="items"
      :autoDetectSizes="true"
      :dynamicSizes="expandedItems"
      :scrollDebounce="100"
      direction="column"
      @load="handleLoad"
      @hide="handleHide"
    >
      <template #default="{ item, index }">
        <div 
          class="item" 
          :class="{'expanded': index in expandedItems}"
        >
          <div class="item-header" @click="toggleExpand(index)">
            {{ item.text }}
            <span v-if="index in expandedItems">▲</span>
            <span v-else>▼</span>
          </div>
          
          <div 
            v-if="index in expandedItems"
            class="item-content"
            :style="{
              height: `${expandedItems[index]}px`,
              minHeight: `${expandedItems[index]}px`
            }"
          >
            <p>Expanded content for item {{ index }}</p>
          </div>
        </div>
      </template>
      <template #loading="{ index }">
        <div class="item loading">
          Loading item {{ index }}...
        </div>
      </template>
    </LazyVirtualList>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import LazyVirtualList from 'vue-lazy-virtual-scroll';

const items = ref(Array.from({ length: 10000 }, (_, i) => ({ 
  id: i, 
  text: `Item ${i}` 
})));

const expandedItems = ref({});

const toggleExpand = (index) => {
  if (index in expandedItems.value) {
    delete expandedItems.value[index];
  } else {
    expandedItems.value[index] = 300; // expanded height
  }
  expandedItems.value = { ...expandedItems.value };
};

const handleLoad = ({ startIndex, endIndex }) => {
  console.log(`Visible range: ${startIndex} - ${endIndex}`);
};

const handleHide = ({ startIndex, endIndex }) => {
  console.log(`Hidden range: ${startIndex} - ${endIndex}`);
};
</script>

<style>
.item {
  padding: 10px;
  min-height: 50px;
  border-bottom: 1px solid #eee;
  box-sizing: border-box; /* Ensures padding is included in height */
}
.item.expanded {
  background-color: #f0f8ff;
}
.item-header {
  cursor: pointer;
  display: flex;
  justify-content: space-between;
}
.item-content {
  padding: 10px;
  background-color: #f9f9f9;
}
.item.loading {
  background-color: #f5f5f5;
  color: #999;
}
</style>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `totalItems` | `number` | *(required)* | Total number of items in the list |
| `itemSize` | `number` | *(required)* | Base height/width of each item in pixels |
| `data` | `any[]` | `[]` | Array of data items to render |
| `datasets` | `Dataset[]` | `[]` | Alternative to `data` for fragmented datasets |
| `direction` | `'row' \| 'column'` | `'column'` | Scroll direction |
| `itemBuffer` | `number` | `3` | Number of items to render outside visible area |
| `scrollThrottle` | `number` | `0` | Throttle scroll events (milliseconds) |
| `scrollDebounce` | `number` | `0` | Debounce scroll events (milliseconds) |
| `scrollStart` | `number` | `0` | Initial scroll position |
| `dynamicSizes` | `{ [itemIndex: string]: number }` | `{}` | Manual size overrides for specific items |
| `autoDetectSizes` | `boolean` | `false` | Automatically detect item sizes |
| `minItemSize` | `number` | `0` | Minimum size for dynamically sized items |
| `sortDatasets` | `boolean` | `true` | Automatically sort datasets by startingIndex |
| `outerMaxLengthCssValue` | `string` | `'100%'` | Maximum length CSS value for the outer container |
| `outerMinLengthCssValue` | `string` | `'100%'` | Minimum length CSS value for the outer container |
| `outerLengthCssValue` | `string` | `'100%'` | Length CSS value for the outer container |
| `listItemStyle` | `{ [key: string]: string }` | `{}` | Custom styles for list items |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@load` | `{ startIndex: number; endIndex: number }` | Emitted when new items become visible and need to be loaded |
| `@hide` | `{ startIndex: number; endIndex: number }` | Emitted when items go out of view and are hidden |
| `@scroll` | `number` | Emitted on scroll with current scroll position |

## Slots

| Name | Props | Description |
|------|-------|-------------|
| `default` | `{ item: any, index: number }` | Template for rendering each item |
| `loading` | `{ index: number }` | Template for rendering loading state |

## Event Examples

### Using @load and @hide for Data Management

```vue
<template>
  <div style="height: 500px; width: 100%">
    <LazyVirtualList
      :totalItems="100000"
      :itemSize="60"
      @load="handleLoad"
      @hide="handleHide"
      @scroll="handleScroll"
    >
      <template #default="{ item, index }">
        <div class="item">
          Item {{ index }} {{ item ? `- ${item.text}` : '(Loading...)' }}
        </div>
      </template>
      <template #loading="{ index }">
        <div class="item loading">
          Loading item {{ index }}...
        </div>
      </template>
    </LazyVirtualList>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import LazyVirtualList from '@lazy-virtual-scroll/vue';

const loadedRanges = ref(new Set());
const hiddenRanges = ref(new Set());

const handleLoad = ({ startIndex, endIndex }) => {
  console.log(`Loading items ${startIndex} to ${endIndex}`);
  
  // Track loaded ranges
  const rangeKey = `${startIndex}-${endIndex}`;
  loadedRanges.value.add(rangeKey);
  
  // Simulate async data loading
  setTimeout(() => {
    console.log(`Loaded items ${startIndex} to ${endIndex}`);
  }, 100);
};

const handleHide = ({ startIndex, endIndex }) => {
  console.log(`Hiding items ${startIndex} to ${endIndex}`);
  
  // Track hidden ranges for cleanup
  const rangeKey = `${startIndex}-${endIndex}`;
  hiddenRanges.value.add(rangeKey);
  
  // Optional: Clean up data that's no longer visible
  // This can help with memory management for large datasets
};

const handleScroll = (scrollPosition) => {
  console.log(`Scrolled to position: ${scrollPosition}`);
};
</script>

<style>
.item {
  height: 60px;
  padding: 10px;
  border-bottom: 1px solid #eee;
  box-sizing: border-box; /* Ensures padding is included in height */
}
.item.loading {
  opacity: 0.6;
}
</style>
```

## Working with Fragmented Datasets

For scenarios where your data is loaded in chunks or comes from different sources, you can use the `datasets` prop instead of `data`:

```js
const datasets = ref([
  { startingIndex: 0, data: [{id: 0, text: 'Item 0'}, {id: 1, text: 'Item 1'}, /* ... */] },
  { startingIndex: 100, data: [{id: 100, text: 'Item 100'}, /* ... */] },
  // More dataset chunks...
]);
```

```vue
<LazyVirtualList
  :datasets="datasets"
  :totalItems="10000"
  :itemSize="50"
  <!-- ...other props -->
>
  <!-- slots -->
</LazyVirtualList>
```

## Dynamic Sizing

The component supports dynamic item sizes in two ways:

1. **Manual Size Specification**:
   ```js
   const dynamicSizes = ref({
     5: 100,  // Item at index 5 has height 100px
     10: 200, // Item at index 10 has height 200px
   });
   ```

   ```vue
   <LazyVirtualList
     :dynamicSizes="dynamicSizes"
     <!-- ...other props -->
   >
     <!-- slots -->
   </LazyVirtualList>
   ```

2. **Automatic Size Detection**:
   ```vue
   <LazyVirtualList
     :autoDetectSizes="true"
     <!-- ...other props -->
   >
     <!-- slots -->
   </LazyVirtualList>
   ```

## Performance Optimization

For optimal performance with large lists:

1. Use both `scrollThrottle` and `scrollDebounce` to limit scroll event processing:
   ```vue
   <LazyVirtualList
     :scrollThrottle="16"  <!-- ~60fps -->
     :scrollDebounce="100" <!-- Final update after scrolling stops -->
     <!-- ...other props -->
   >
     <!-- slots -->
   </LazyVirtualList>
   ```

2. Keep component renders lightweight by using `v-memo` for list items:
   ```vue
   <template #default="{ item, index }">
     <div v-memo="[item.id, item.text]" class="item">
       {{ item.text }}
     </div>
   </template>
   ```

## Dynamic Sizing

The component supports dynamic item sizes in two ways:

1. **Manual Size Specification**:
   ```vue
   <script setup>
   const dynamicSizes = ref({
     5: 100,  // Item at index 5 has height 100px
     10: 200, // Item at index 10 has height 200px
   });
   </script>
   
   <template>
     <LazyVirtualList
       :dynamicSizes="dynamicSizes"
       <!-- ...other props -->
     />
   </template>
   ```

2. **Automatic Size Detection**:
   ```vue
   <LazyVirtualList
     :autoDetectSizes="true"
     <!-- ...other props -->
   />
   ```

## Performance Optimization

For optimal performance with large lists:

1. Use both `scrollThrottle` and `scrollDebounce` to limit scroll event processing:
   ```vue
   <LazyVirtualList
     :scrollThrottle="16"
     :scrollDebounce="100"
     <!-- ...other props -->
   />
   ```

2. Use `v-memo` for complex items to prevent unnecessary re-renders:
   ```vue
   <LazyVirtualList>
     <template #default="{ item, index }">
       <div v-memo="[item?.id, item?.updatedAt]" class="complex-item">
         <!-- Complex item content -->
         {{ item?.content }}
       </div>
     </template>
   </LazyVirtualList>
   ```

3. Keep item templates simple and avoid heavy computations in templates:
   ```vue
   <!-- Good: Simple, reactive data -->
   <template #default="{ item, index }">
     <div class="item">
       <h3>{{ item.title }}</h3>
       <p>{{ item.description }}</p>
     </div>
   </template>
   
   <!-- Avoid: Heavy computations in templates -->
   <template #default="{ item, index }">
     <div class="item">
       <!-- This will run on every render -->
       <h3>{{ processComplexTitle(item.rawData) }}</h3>
     </div>
   </template>
   ```

## Running unit tests

Run `nx test @lazy-virtual-scroll/vue` to execute the unit tests via [Vitest](https://vitest.dev/).

## License

MIT
