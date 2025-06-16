<template>
  <div class="scroll-prop-controls" :class="{ 'collapsed': !isExpanded }">
    <div class="header-row">
      <div class="header-left">
        <h3>Control Panel</h3>
        <span class="badge">{{localModelValue.direction === 'column' ? 'Vertical' : 'Horizontal'}}</span>
        <span class="badge">{{localModelValue.autoDetectSizes ? 'Dynamic Sizing' : 'Fixed Sizing'}}</span>
      </div>
      <button class="toggle-button" @click="toggleControls">
        <span v-if="isExpanded">Hide Controls</span>
        <span v-else>Show Controls</span>
      </button>
    </div>
    <div v-if="isExpanded" class="control-content">
      <div class="control-tabs">
        <button 
          :class="{ 'active': activeTab === 'basic' }" 
          @click="activeTab = 'basic'">
          Basic
        </button>
        <button 
          :class="{ 'active': activeTab === 'advanced' }" 
          @click="activeTab = 'advanced'">
          Advanced
        </button>
        <button 
          :class="{ 'active': activeTab === 'performance' }" 
          @click="activeTab = 'performance'">
          Performance
        </button>
      </div>

      <div class="control-panel" v-if="activeTab === 'basic'">
        <div class="control-grid">
          <div class="control-item range">
            <div class="control-header">
              <label for="itemSize">
                Item Size
                <span class="tooltip" title="Default height/width of each item in pixels">ⓘ</span>
              </label>
              <span class="value">{{localModelValue.itemSize}}px</span>
            </div>
            <input
              id="itemSize"
              type="range"
              v-model.number="localModelValue.itemSize"
              min="20"
              max="200"
              step="5"
            />
          </div>

          <div class="control-item range">
            <div class="control-header">
              <label for="totalItems">
                Total Items
                <span class="tooltip" title="Total number of items to render in the list">ⓘ</span>
              </label>
              <span class="value">{{localModelValue.totalItems}}</span>
            </div>
            <input
              id="totalItems"
              type="range"
              v-model.number="localModelValue.totalItems"
              min="10"
              max="10000"
              step="10"
            />
          </div>

          <div class="control-item">
            <label for="autoDetectSizes">
              Auto Detect Sizes
              <span class="tooltip" title="Automatically detect and adjust to variable item sizes">ⓘ</span>
            </label>
            <div class="toggle-switch">
              <input
                id="autoDetectSizes"
                type="checkbox"
                v-model="localModelValue.autoDetectSizes"
              />
              <span class="slider"
                @click="localModelValue.autoDetectSizes = !localModelValue.autoDetectSizes"
              ></span>
              <span class="label-left">Off</span>
              <span class="label-right">On</span>
            </div>
          </div>
        </div>
      </div>

      <div class="control-panel" v-if="activeTab === 'advanced'">
        <div class="control-grid">
          <div class="control-item range">
            <div class="control-header">
              <label for="itemBuffer">
                Item Buffer
                <span class="tooltip" title="Number of items to render beyond visible area">ⓘ</span>
              </label>
              <span class="value">{{localModelValue.itemBuffer}}</span>
            </div>
            <input
              id="itemBuffer"
              type="range"
              v-model.number="localModelValue.itemBuffer"
              min="0"
              max="20"
              step="1"
            />
          </div>

          <div class="control-item range">
            <div class="control-header">
              <label for="scrollStart">
                Scroll Start Position
                <span class="tooltip" title="Initial scroll position in pixels">ⓘ</span>
              </label>
              <span class="value">{{localModelValue.scrollStart}}px</span>
            </div>
            <input
              id="scrollStart"
              type="range"
              v-model.number="localModelValue.scrollStart"
              min="0"
              max="5000"
              step="100"
            />
          </div>

          <div class="control-item range">
            <div class="control-header">
              <label for="minItemSize">
                Min Item Size
                <span class="tooltip" title="Minimum height/width for items with dynamic sizing">ⓘ</span>
              </label>
              <span class="value">{{localModelValue.minItemSize}}px</span>
            </div>
            <input
              id="minItemSize"
              type="range"
              v-model.number="localModelValue.minItemSize"
              min="0"
              max="100"
              step="5"
            />
          </div>

          <div class="control-item">
            <label for="sortDatasets">
              Sort Datasets
              <span class="tooltip" title="Whether to sort datasets by their starting index">ⓘ</span>
            </label>
            <div class="toggle-switch">
              <input
                id="sortDatasets"
                type="checkbox"
                v-model="localModelValue.sortDatasets"
              />
              <span class="slider"
                @click="localModelValue.sortDatasets = !localModelValue.sortDatasets"
              ></span>
              <span class="label-left">Off</span>
              <span class="label-right">On</span>
            </div>
          </div>
        </div>
      </div>

      <div class="control-panel" v-if="activeTab === 'performance'">
        <div class="control-grid">
          <div class="control-item range">
            <div class="control-header">
              <label for="scrollThrottle">
                Scroll Throttle
                <span class="tooltip" title="Sets the throttling time for scroll events in milliseconds">ⓘ</span>
              </label>
              <span class="value">{{localModelValue.scrollThrottle}}ms</span>
            </div>
            <input
              id="scrollThrottle"
              type="range"
              v-model.number="localModelValue.scrollThrottle"
              min="0"
              max="200"
              step="10"
            />
          </div>

          <div class="control-item range">
            <div class="control-header">
              <label for="scrollDebounce">
                Scroll Debounce
                <span class="tooltip" title="Sets the debounce time for scroll events in milliseconds">ⓘ</span>
              </label>
              <span class="value">{{localModelValue.scrollDebounce}}ms</span>
            </div>
            <input
              id="scrollDebounce"
              type="range"
              v-model.number="localModelValue.scrollDebounce"
              min="0"
              max="500"
              step="10"
            />
          </div>
        </div>
      </div>

      <div class="control-actions">
        <button class="secondary" @click="resetToDefaults">Reset to Defaults</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { type ScrollProps, defaultScrollProps } from '@lazy-virtual-scroll/core';

const props = defineProps<{
  modelValue: ScrollProps;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: ScrollProps): void;
}>();

// State for controlling the visibility of the controls
const isExpanded = ref(true);
const activeTab = ref('basic');

// Toggle the visibility of controls
const toggleControls = () => {
  isExpanded.value = !isExpanded.value;
};

// Create a local copy of the model value using computed property
const localModelValue = computed({
  get: () => {
    // If modelValue is undefined or null, return default props with totalItems
    if (!props.modelValue) {
      return {
        ...defaultScrollProps,
        totalItems: 300
      } as ScrollProps;
    }
    // Otherwise return the model value
    return props.modelValue;
  },
  set: (value: ScrollProps) => {
    emit('update:modelValue', value);
  }
});

// Toggle direction between column and row
const toggleDirection = () => {
  const currentValue = { ...localModelValue.value };
  localModelValue.value = {
    ...currentValue,
    direction: currentValue.direction === 'column' ? 'row' : 'column'
  };
};

// Reset all values to their defaults
const resetToDefaults = () => {
  localModelValue.value = { 
    ...defaultScrollProps,
    totalItems: 300,
  };
};
</script>

<style lang="scss" scoped>
.scroll-prop-controls {
  width: 100%;
  max-width: 800px;
  border-radius: 12px;
  background-color: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  transition: all 0.3s ease;
  overflow: hidden;
  
  &.collapsed {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(to right, #6366f1, #8b5cf6);
  color: white;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.badge {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 0.7rem;
  font-weight: 500;
}

.toggle-button {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }
}

.control-content {
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

.control-tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #eaeaea;

  button {
    background: none;
    border: none;
    padding: 10px 20px;
    font-size: 0.9rem;
    font-weight: 500;
    color: #666;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;

    &.active {
      color: #6366f1;
      border-bottom: 2px solid #6366f1;
    }
    
    &:hover:not(.active) {
      color: #8b5cf6;
      border-bottom: 2px solid #e0e7ff;
    }
  }
}

.control-panel {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.control-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.control-item {
  display: flex;
  flex-direction: column;
  
  &.range {
    input[type="range"] {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 6px;
      border-radius: 10px;
      background: #e0e7ff;
      outline: none;
      
      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #6366f1;
        cursor: pointer;
        transition: background 0.2s;
        
        &:hover {
          background: #4f46e5;
        }
      }
      
      &::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #6366f1;
        cursor: pointer;
        transition: background 0.2s;
        
        &:hover {
          background: #4f46e5;
        }
      }
    }
  }
}

.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  
  .value {
    font-size: 0.85rem;
    color: #6366f1;
    font-weight: 600;
  }
}

.control-item label {
  margin-bottom: 8px;
  font-weight: 500;
  color: #4b5563;
}

/* Toggle Switch Styling */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 30px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
    
    &:checked + .slider {
      background-color: #6366f1;
      
      &:before {
        transform: translateX(30px);
      }
    }
  }
  
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #e0e7ff;
    transition: .4s;
    border-radius: 34px;
    
    &:before {
      position: absolute;
      content: "";
      height: 22px;
      width: 22px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
  }
  
  .label-left, .label-right {
    position: absolute;
    bottom: -25px;
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .label-left {
    left: 0;
  }
  
  .label-right {
    right: 0;
  }
}

.control-actions {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
  
  button {
    background-color: #6366f1;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 10px 20px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: #4f46e5;
    }
    
    &.secondary {
      background-color: #e0e7ff;
      color: #6366f1;
      
      &:hover {
        background-color: #c7d2fe;
      }
    }
  }
}

h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

/* Tooltip styles */
.tooltip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #e0e7ff;
  color: #6366f1;
  font-size: 0.7rem;
  margin-left: 6px;
  cursor: help;
  position: relative;
  
  &:hover::after {
    content: attr(title);
    position: absolute;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    min-width: 200px;
    padding: 8px 12px;
    border-radius: 6px;
    background-color: #1e293b;
    color: white;
    font-size: 0.8rem;
    font-weight: normal;
    text-align: center;
    z-index: 100;
    white-space: normal;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    pointer-events: none;
  }
  
  &:hover::before {
    content: '';
    position: absolute;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: #1e293b transparent transparent transparent;
    z-index: 100;
  }
}
</style>
