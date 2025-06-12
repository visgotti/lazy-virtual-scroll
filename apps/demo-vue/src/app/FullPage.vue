<template>
  <div class="full-page-container">
    <h1>Lazy Virtual List Example</h1>
    <p class="subtitle">Efficient rendering of large datasets with dynamic sizing and lazy loading</p>
    
    <div class="demo-container" :class="{'horizontal': scrollProps.direction === 'row'}">
      <LazyVirtualScroll
        class="demo"
        @load="handleLoad"
        :datasets="formattedDatasets"
        :totalItems="scrollProps.totalItems"
        :itemSize="scrollProps.itemSize"
        :itemBuffer="scrollProps.itemBuffer"
        :autoDetectSizes="scrollProps.autoDetectSizes"
        :dynamicSizes="openItems"
        :scrollDebounce="scrollProps.scrollDebounce"
        :scrollThrottle="scrollProps.scrollThrottle"
        :direction="scrollProps.direction"
        :sortDatasets="scrollProps.sortDatasets"
        :minItemSize="scrollProps.minItemSize"
        :scrollStart="scrollProps.scrollStart"
      >
        <template #default="{ item, index }">
          <div class="item" :class="{'expanded': index in openItems}">
            <div class="item-header">
              <div class="item-title">{{ item.name }}</div>
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
          <div class="item loading">
            <div class="loading-content">
              <div class="loading-spinner"></div>
              <span>Loading item {{ index }}...</span>
            </div>
          </div>
        </template>
      </LazyVirtualScroll>
    </div>
    
    <div class="stats-panel">
      <div class="stat">
        <div class="stat-value">{{ actualLen.length }}</div>
        <div class="stat-label">Loaded Items</div>
      </div>
      <div class="stat">
        <div class="stat-value">{{ Object.keys(openItems).length }}</div>
        <div class="stat-label">Expanded Items</div>
      </div>
      <div class="stat">
        <div class="stat-value">{{ scrollProps.totalItems }}</div>
        <div class="stat-label">Total Items</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, Ref, defineProps } from 'vue';
import LazyVirtualScroll, { type Dataset, type LoadEventPayload } from '@lazy-virtual-scroll/vue';
import { type ScrollProps } from './ScrollPropControls.vue';

// Define props for receiving scrollProps from parent
const props = defineProps<{
  scrollProps: ScrollProps;
}>();

function generateMockDatasets(totalItems: number, itemsPerDataset: number): Dataset[] {
  const datasets: Dataset[] = [];
  
  for (let i = 0; i < totalItems; i += itemsPerDataset) {
    const data = Array.from({ length: itemsPerDataset }, (_, j) => `Item ${i + j}`);
    datasets.push({
      startingIndex: i,
      data,
    });
  }
  return datasets;
}

const testLoadedCount = ref(200);

const expandedItemHeight = 500;
const datasets = computed(() => generateMockDatasets(testLoadedCount.value, 10));

const formattedDatasets = computed(() => {
  return datasets.value.map((d: any) => {
    return {
      startingIndex: d.startingIndex,
      data: d.data.map((item: string, i: number) => {
        return {
          name: item,
          isExpanded: (d.startingIndex + i) in openItems.value
        }
      })
    }
  });
});
const openItems : Ref<{[itemIndex: string]: number }> = ref({});
const handleToggleExpand = (index: number) => {
  if(index in openItems.value) {
    delete openItems.value[index];
  } else {
    openItems.value[index] = expandedItemHeight;
  }
  openItems.value = { ...openItems.value };
}
function handleLoad(v: LoadEventPayload) {
  console.log('handleLoad', v)
}
const actualLen = computed(() => formattedDatasets.value.map((d: any) => d.data).flat());

</script>

<style lang="scss" scoped>
.full-page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 0 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
  text-align: center;
}

.subtitle {
  font-size: 1.1rem;
  color: #64748b;
  text-align: center;
  margin-bottom: 2rem;
}

.demo-container {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  flex: 1;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid #e2e8f0;
  
  &.horizontal {
    flex-direction: row;
    
    .item {
      height: 100%;
      width: auto;
    }
  }
}

.demo {
  height: 100%;
  width: 100%;
  overflow: auto;
}

.item {
  background-color: #ffffff;
  border-radius: 8px;
  margin: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  &.expanded {
    background-color: #f8fafc;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    
    .item-header {
      background-color: #f1f5f9;
      border-bottom: 1px solid #e2e8f0;
    }
    
    &:hover {
      background-color: #f1f5f9;
    }
  }
  
  &:not(.expanded) {
    height: auto;
    min-height: 60px;
  }
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.item-title {
  font-weight: 500;
  color: #334155;
}

.item-actions {
  display: flex;
  align-items: center;
}

.expand-button {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 0.8rem;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #e2e8f0;
    color: #334155;
  }
}

.item-content {
  padding: 0 15px 15px;
  overflow: hidden;
}

.item-details {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.item-section {
  flex: 1;
  min-width: 200px;
  
  h4 {
    font-size: 1rem;
    color: #334155;
    margin-bottom: 10px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 5px;
  }
  
  p {
    margin: 5px 0;
    color: #64748b;
  }
}

.item-preview {
  background-color: #f8fafc;
  border-radius: 6px;
  padding: 15px;
  border: 1px solid #e2e8f0;
}

.preview-line {
  height: 12px;
  background-color: #e2e8f0;
  border-radius: 6px;
  margin-bottom: 8px;
  
  &:nth-child(1) { width: 100%; }
  &:nth-child(2) { width: 80%; }
  &:nth-child(3) { width: 90%; }
  &:nth-child(4) { width: 65%; }
  &:nth-child(5) { width: 75%; }
}

.item.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8fafc;
  
  .loading-content {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #64748b;
    font-size: 0.9rem;
  }
  
  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #e2e8f0;
    border-top: 2px solid #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.stats-panel {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin: 20px 0;
}

.stat {
  text-align: center;
  
  .stat-value {
    font-size: 1.8rem;
    font-weight: 700;
    color: #6366f1;
  }
  
  .stat-label {
    font-size: 0.9rem;
    color: #64748b;
  }
}
</style>