<template>
  <div class="app-container">
    <header class="app-header">
      <div class="logo-container">
        <div class="logo">
          <span class="logo-text">Lazy<span class="highlight">Virtual</span>Scroll</span>
        </div>
        <span class="version">Vue Demo v1.0.0</span>
      </div>
    </header>
    
    <main class="app-content">
      <ScrollPropControls v-model="scrollProps" />
      
      <div class="demo-section">
        <h1>Lazy Virtual List - Vue Example</h1>
        <p class="subtitle">Efficient rendering of large datasets with dynamic sizing and lazy loading</p>
        
        <div class="demo-container">
          <LazyVirtualScroll
            class="demo"
            @load="handleLoad"
            @hide="handleHide"
            :datasets="formattedDatasets"
            :totalItems="scrollProps.totalItems"
            :itemSize="scrollProps.itemSize"
            :itemBuffer="scrollProps.itemBuffer"
            :autoDetectSizes="scrollProps.autoDetectSizes"
            :dynamicSizes="openItems"
            :scrollDebounce="scrollProps.scrollDebounce"
            :scrollThrottle="scrollProps.scrollThrottle"
            :sortDatasets="scrollProps.sortDatasets"
            :minItemSize="scrollProps.minItemSize"
            :scrollStart="scrollProps.scrollStart"
          >
            <template #default="{ item, index }">
              <!-- Regular item rendering - loading is handled by #loading slot -->
              <div class="item" :class="{'expanded': index in openItems}">
                <div class="item-header">
                  <div class="item-title">
                    {{ item.name }}
                    <span class="show-count-badge">Shown: {{ item.showCount }}x</span>
                  </div>
                  <div class="item-actions">
                    <button class="expand-button" @click.stop="handleToggleExpand(index)">
                      <span v-if="item.isExpanded">▲</span>
                      <span v-else>▼</span>
                    </button>
                  </div>
                </div>
                <div v-if="item.isExpanded" class="item-content"
                  :style="{
                    height: `${openItems[index]}px`,
                    minHeight: `${openItems[index]}px`,
                  }"
                >
                  <div class="item-details">
                    <div class="item-section">
                      <h4>Item Details</h4>
                      <p>ID: <strong>{{ index }}</strong></p>
                      <p>Size: <strong>{{ openItems[index] }}px</strong></p>
                      <p>Type: <strong>Expandable</strong></p>
                    </div>
                    <div class="item-section">
                      <h4>Content Preview</h4>
                      <div class="item-preview">
                        <div v-for="i in 5" :key="i" class="preview-line"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <template #loading="{ index }">
              <div class="item">
                <div class="item-header">
                  <div class="item-title">
                    <div class="loading-content">
                      <div class="loading-spinner"></div>
                      <span>Loading item {{ index }}...</span>
                      <div class="loading-progress">
                        <div class="progress-bar">
                          <div 
                            class="progress-fill"
                            :style="{
                              width: '50%'
                            }"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="item-actions">
                    <button class="expand-button" style="visibility: hidden">
                      <span>▼</span>
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </LazyVirtualScroll>
        </div>
        
        <div class="stats-panel">
          <div class="stat">
            <div class="stat-value">{{ Object.keys(openItems).length }}</div>
            <div class="stat-label">Expanded Items</div>
          </div>
          <div class="stat">
            <div class="stat-value">{{ uniqueLoadedItemsCount }}</div>
            <div class="stat-label">Loaded Items</div>
          </div>
          <div class="stat">
            <div class="stat-value">{{ scrollProps.totalItems }}</div>
            <div class="stat-label">Total Items</div>
          </div>
        </div>
      </div>
    </main>
    
    <footer class="app-footer">
      <div class="footer-content">
        <p>
          &copy; 2025 Lazy Virtual Scroll. Released under MIT License.
          <a href="https://github.com/visgotti/lazy-virtual-scroll" target="_blank" class="footer-link">GitHub</a>
          <a href="https://www.npmjs.com/package/@lazy-virtual-scroll/vue" target="_blank" class="footer-link">NPM</a>
        </p>
      </div>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import LazyVirtualScroll, { type Dataset, type LoadEventPayload } from '@lazy-virtual-scroll/vue';
import ScrollPropControls from './ScrollPropControls.vue';
import { 
  type ScrollProps,
  defaultScrollProps
} from '@lazy-virtual-scroll/core';
import { 
  type MockDataItem,
  generateMockDatasets,
  loadDatasetWithDelay
} from '@lazy-virtual-scroll/shared-mock';

// Initialize with default values from core
const scrollProps = ref<ScrollProps>({ 
  ...defaultScrollProps,
  totalItems: 300,
 });
const openItems = ref<{ [itemIndex: string]: number }>({});
const loadedDatasets = ref<Dataset<object>[]>([]);
const itemShowCounts = ref<{ [key: number]: number }>({});
const hiddenItems = ref<Set<number>>(new Set());
const expandedItemHeight = 500;

const datasets = computed(() => loadedDatasets.value);

const formattedDatasets = computed(() => {
  return datasets.value.map((d: Dataset<object>) => ({
    startingIndex: d.startingIndex,
    data: d.data.map((item, i) => {
      const itemIndex = d.startingIndex + i;
      return {
        ...item,
        isExpanded: itemIndex in openItems.value,
        showCount: itemShowCounts.value[itemIndex] || 0,
      };
    }),
  }));
});

const handleToggleExpand = (index: number) => {
  if(index in openItems.value) {
    const newOpenItems = { ...openItems.value };
    delete newOpenItems[index];
    openItems.value = newOpenItems;
  } else {
    openItems.value = { 
      ...openItems.value,
      [index]: expandedItemHeight
    };
  }
};

const handleLoad = (v: LoadEventPayload) => {
  // When items need to be loaded, this callback fires
  const startIndex = v.startIndex;
  const endIndex = v.endIndex;
  const itemCount = endIndex - startIndex + 1;
  
  // Update show counts for newly visible items
  const newCounts = { ...itemShowCounts.value };
  for (let i = startIndex; i <= endIndex; i++) {
    // Increment count if item was previously hidden or if it's the first time
    if (hiddenItems.value.has(i) || !(i in newCounts)) {
      newCounts[i] = (newCounts[i] || 0) + 1;
    }
  }
  itemShowCounts.value = newCounts;
  
  // Remove items from hidden set since they're now visible
  const newHidden = new Set(hiddenItems.value);
  for (let i = startIndex; i <= endIndex; i++) {
    newHidden.delete(i);
  }
  hiddenItems.value = newHidden;
  
  // Check if we already have this data loaded
  const alreadyLoaded = loadedDatasets.value.some(dataset => 
    dataset.startingIndex <= startIndex && 
    (dataset.startingIndex + dataset.data.length) >= (startIndex + itemCount)
  );
  
  if (alreadyLoaded) {
    // Data is already loaded, no need to fetch again
    return;
  }
  
  // Simulate fetching data
  loadDatasetWithDelay(startIndex, itemCount)
    .then((loadedDataset) => {
      // Add the loaded dataset
      loadedDatasets.value = [...loadedDatasets.value, loadedDataset];
    })
    .catch((error) => {
      console.error('Failed to load dataset:', error);
    });
};

const handleHide = (v: LoadEventPayload) => {
  // When items go out of view, mark them as hidden
  const startIndex = v.startIndex;
  const endIndex = v.endIndex;
  
  const newHidden = new Set(hiddenItems.value);
  for (let i = startIndex; i <= endIndex; i++) {
    newHidden.add(i);
  }
  hiddenItems.value = newHidden;
};

// Compute unique loaded items count
const uniqueLoadedItemsCount = computed(() => {
  const loadedIndexes = new Set<number>();
  loadedDatasets.value.forEach(dataset => {
    for (let i = 0; i < dataset.data.length; i++) {
      loadedIndexes.add(dataset.startingIndex + i);
    }
  });
  return loadedIndexes.size;
});
</script>

<style lang="scss">
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #1e293b;
  background-color: #f8fafc;
  height: 100vh;
  margin: 0;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(to right, #6366f1, #8b5cf6);
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
}

.logo-text {
  .highlight {
    color: #c7d2fe;
  }
}

.version {
  font-size: 0.8rem;
  opacity: 0.8;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 8px;
}

.app-content {
  flex: 1;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
}

.demo-section {
  margin-top: 2rem;
  
  h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: #1e293b;
  }
  
  .subtitle {
    color: #64748b;
    margin-bottom: 2rem;
  }
}

.demo-container {
  position: relative;
  height: 600px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background-color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  
  &.horizontal {
    height: 300px;
  }
  
  .demo {
    height: 100%;
    width: 100%;
  }
}

.item {
  border-bottom: 1px solid #e2e8f0;
  transition: all 0.2s ease-in-out;
  overflow: hidden;
  
  &.expanded {
    background-color: #f8fafc;
    
    &:hover {
      background-color: #f1f5f9;
    }
  }
  
  &:hover {
    background-color: #f1f5f9;
  }
  
  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    height: 65px;
    max-height: 65px;
    box-sizing: border-box;
  }
  
  .item-title {
    font-weight: 500;
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .show-count-badge {
    background: linear-gradient(to right, #10b981, #059669);
    color: white;
    font-size: 0.75rem;
    font-weight: 500;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    min-width: fit-content;
    white-space: nowrap;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .item-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .expand-button {
    background-color: #e2e8f0;
    color: #64748b;
    border: none;
    border-radius: 4px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background-color: #cbd5e1;
      color: #334155;
    }
  }
  
  .item-content {
    padding: 0 1rem 1rem;
    overflow: hidden;
  }
  
  .item-details {
    display: flex;
    gap: 2rem;
    
    @media (max-width: 640px) {
      flex-direction: column;
      gap: 1rem;
    }
  }
  
  .item-section {
    flex: 1;
    
    h4 {
      margin-bottom: 0.5rem;
      color: #334155;
      font-size: 1rem;
    }
    
    p {
      margin-bottom: 0.25rem;
      color: #64748b;
    }
  }
  
  .item-preview {
    margin-top: 0.5rem;
    
    .preview-line {
      height: 8px;
      background-color: #e2e8f0;
      border-radius: 4px;
      margin-bottom: 8px;
      
      &:nth-child(1) { width: 100%; }
      &:nth-child(2) { width: 85%; }
      &:nth-child(3) { width: 70%; }
      &:nth-child(4) { width: 90%; }
      &:nth-child(5) { width: 60%; }
    }
  }
}

.stats-panel {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
  gap: 2rem;
  
  @media (max-width: 640px) {
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .stat {
    text-align: center;
    background-color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    min-width: 120px;
    
    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #6366f1;
      margin-bottom: 0.25rem;
    }
    
    .stat-label {
      font-size: 0.9rem;
      color: #64748b;
    }
  }
}

.app-footer {
  background-color: #1e293b;
  color: #94a3b8;
  padding: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-link {
  color: #e0e7ff;
  text-decoration: none;
  margin-left: 1rem;
  transition: color 0.2s;
  
  &:hover {
    color: white;
    text-decoration: underline;
  }
}

@keyframes spinner {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.loading-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #94a3b8;
  animation: pulse 1.5s infinite ease-in-out;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spinner 0.8s linear infinite;
}

.loading-progress {
  margin-top: 8px;
  width: 100%;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
  transition: width 0.1s ease-out;
}
</style>
