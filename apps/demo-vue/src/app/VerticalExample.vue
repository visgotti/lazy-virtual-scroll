<template>
  <div>
    <h2>Vertical Scroll</h2>
    <ScrollPropControls v-model="demo.scrollProps.value" :defaults="demo.initialScrollProps" />
    <div class="demo-container">
      <LazyVirtualScroll
        class="demo"
        @load="demo.handleLoad"
        @hide="demo.handleHide"
        :datasets="demo.formattedDatasets.value"
        :totalItems="demo.scrollProps.value.totalItems"
        :itemSize="demo.scrollProps.value.itemSize"
        :itemBuffer="demo.scrollProps.value.itemBuffer"
        :autoDetectSizes="demo.scrollProps.value.autoDetectSizes"
        :dynamicSizes="demo.openItems.value"
        :scrollDebounce="demo.scrollProps.value.scrollDebounce"
        :scrollThrottle="demo.scrollProps.value.scrollThrottle"
        :sortDatasets="demo.scrollProps.value.sortDatasets"
        :minItemSize="demo.scrollProps.value.minItemSize"
        :scrollStart="demo.scrollProps.value.scrollStart"
        :direction="demo.scrollProps.value.direction"
      >
        <template #default="{ item, index }">
          <!-- Regular item rendering - loading is handled by #loading slot -->
          <div class="item" :class="{'expanded': index in demo.openItems.value}">
            <div class="item-header">
              <div class="item-title">
                {{ item.name }}
                <span class="show-count-badge">Shown: {{ item.showCount }}x</span>
              </div>
              <div class="item-actions">
                <button class="expand-button" @click.stop="demo.handleToggleExpand(index)">
                  <span v-if="item.isExpanded">▲</span>
                  <span v-else>▼</span>
                </button>
              </div>
            </div>
            <div v-if="item.isExpanded" class="item-content"
              :style="{
                height: `${demo.openItems.value[index]}px`,
                minHeight: `${demo.openItems.value[index]}px`,
              }"
            >
              <div class="item-details">
                <div class="item-section">
                  <h4>Item Details</h4>
                  <p>ID: <strong>{{ index }}</strong></p>
                  <p>Size: <strong>{{ demo.openItems.value[index] }}px</strong></p>
                  <p>Type: <strong>Expandable</strong></p>
                </div>
                <div class="item-section">
                  <h4>Content Preview</h4>
                  <div class="item-preview">
                    <p class="preview-text">{{ getLoremText(index) }}</p>
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
        <div class="stat-value">{{ Object.keys(demo.openItems.value).length }}</div>
        <div class="stat-label">Expanded Items</div>
      </div>
      <div class="stat">
        <div class="stat-value">{{ demo.uniqueLoadedItemsCount.value }}</div>
        <div class="stat-label">Loaded Items</div>
      </div>
      <div class="stat">
        <div class="stat-value">{{ demo.scrollProps.value.totalItems }}</div>
        <div class="stat-label">Total Items</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import LazyVirtualScroll from '@lazy-virtual-scroll/vue';
import ScrollPropControls from './ScrollPropControls.vue';
import { useVirtualListDemo } from './useVirtualListDemo';
import { getLoremText } from '@lazy-virtual-scroll/shared-mock';

const demo = useVirtualListDemo({ direction: 'column' });
</script>
