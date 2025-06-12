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

const handleLoad = ({ startIndex, endIndex }) => {
  console.log(`Loading items from ${startIndex} to ${endIndex}`);
};
</script>

<style>
.item {
  height: 50px;
  padding: 10px;
  border-bottom: 1px solid #eee;
}
.item.loading {
  background-color: #f5f5f5;
  color: #999;
}
</style>
```

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
</script>

<style>
.item {
  padding: 10px;
  min-height: 50px;
  border-bottom: 1px solid #eee;
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
| `outerMaxLengthProp` | `string` | `'100%'` | Maximum length of the outer container |
| `outerMinLengthProp` | `string` | `'100%'` | Minimum length of the outer container |
| `outerLengthProp` | `string` | `'100%'` | Length of the outer container |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `load` | `{ startIndex: number; endIndex: number }` | Emitted when visible range changes |
| `scroll` | `number` | Emitted on scroll with current scroll position |

## Slots

| Name | Props | Description |
|------|-------|-------------|
| `default` | `{ item: any, index: number }` | Template for rendering each item |
| `loading` | `{ index: number }` | Template for rendering loading state |

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

## Running unit tests

Run `nx test @lazy-virtual-scroll/vue` to execute the unit tests via [Vitest](https://vitest.dev/).

## License

MIT
