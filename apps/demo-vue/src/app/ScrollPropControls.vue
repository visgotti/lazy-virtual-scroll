<template>
  <div class="scroll-prop-controls">
    <div class="header-row">
      <h3>Scroll Component Controls</h3>
      <button class="toggle-button" @click="toggleControls">
        {{ isExpanded ? 'Hide Controls' : 'Show Controls' }}
      </button>
    </div>
    <div v-if="isExpanded" class="control-content">
      <div class="control-grid">
        <div class="control-item">
          <label for="itemSize">Item Size (px)</label>
          <input
            id="itemSize"
            type="number"
            v-model.number="localModelValue.itemSize"
            min="1"
          />
        </div>

        <div class="control-item">
          <label for="itemBuffer">Item Buffer</label>
          <input
            id="itemBuffer"
            type="number"
            v-model.number="localModelValue.itemBuffer"
            min="0"
          />
        </div>

        <div class="control-item">
          <label for="totalItems">Total Items</label>
          <input
            id="totalItems"
            type="number"
            v-model.number="localModelValue.totalItems"
            min="0"
          />
        </div>

        <div class="control-item">
          <label for="scrollStart">Scroll Start Position (px)</label>
          <input
            id="scrollStart"
            type="number"
            v-model.number="localModelValue.scrollStart"
            min="0"
          />
        </div>

        <div class="control-item">
          <label for="scrollThrottle">Scroll Throttle (ms)</label>
          <input
            id="scrollThrottle"
            type="number"
            v-model.number="localModelValue.scrollThrottle"
            min="0"
          />
        </div>

        <div class="control-item">
          <label for="scrollDebounce">Scroll Debounce (ms)</label>
          <input
            id="scrollDebounce"
            type="number"
            v-model.number="localModelValue.scrollDebounce"
            min="0"
          />
        </div>

        <div class="control-item">
          <label for="minItemSize">Min Item Size (px)</label>
          <input
            id="minItemSize"
            type="number"
            v-model.number="localModelValue.minItemSize"
            min="0"
          />
        </div>

        <div class="control-item checkbox">
          <label for="autoDetectSizes">Auto Detect Sizes</label>
          <input
            id="autoDetectSizes"
            type="checkbox"
            v-model="localModelValue.autoDetectSizes"
          />
        </div>

        <div class="control-item">
          <label for="direction">Direction</label>
          <select id="direction" v-model="localModelValue.direction">
            <option value="column">Column (vertical)</option>
            <option value="row">Row (horizontal)</option>
          </select>
        </div>

        <div class="control-item checkbox">
          <label for="sortDatasets">Sort Datasets</label>
          <input
            id="sortDatasets"
            type="checkbox"
            v-model="localModelValue.sortDatasets"
          />
        </div>
      </div>

      <div class="control-actions">
        <button @click="resetToDefaults">Reset to Defaults</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

export interface ScrollProps {
  itemSize: number;
  itemBuffer: number;
  totalItems: number;
  scrollStart: number;
  scrollThrottle: number;
  scrollDebounce: number;
  minItemSize: number;
  autoDetectSizes: boolean;
  direction: 'row' | 'column';
  sortDatasets: boolean;
}

// Default values for the scroll props
const defaultProps: ScrollProps = {
  itemSize: 65,
  itemBuffer: 3,
  totalItems: 300,
  scrollStart: 0,
  scrollThrottle: 0,
  scrollDebounce: 100,
  minItemSize: 0,
  autoDetectSizes: true,
  direction: 'column',
  sortDatasets: true
};

const props = defineProps<{
  modelValue: ScrollProps;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: ScrollProps): void;
}>();

// State for controlling the visibility of the controls
const isExpanded = ref(true);

// Toggle the visibility of controls
const toggleControls = () => {
  isExpanded.value = !isExpanded.value;
};

// Create a local copy of the model value
const localModelValue = computed({
  get: () => props.modelValue || { ...defaultProps },
  set: (value) => {
    emit('update:modelValue', value);
  }
});

// Watch for changes in the local model value and emit updates
watch(
  localModelValue,
  (newValue) => {
    emit('update:modelValue', { ...newValue });
  },
  { deep: true }
);

// Reset all values to their defaults
const resetToDefaults = () => {
  localModelValue.value = { ...defaultProps };
};
</script>

<style scoped>
.scroll-prop-controls {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  background-color: #f9f9f9;
  margin-bottom: 20px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.toggle-button {
  background-color: #4a7bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
}

.toggle-button:hover {
  background-color: #3a6bef;
}

.control-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.control-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.control-item {
  display: flex;
  flex-direction: column;
}

.control-item.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.control-item label {
  margin-bottom: 5px;
  font-weight: 500;
}

.control-item input[type="number"],
.control-item select {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.control-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

button {
  background-color: #4a7bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: 500;
}

button:hover {
  background-color: #3a6bef;
}

h3 {
  margin: 0;
  color: #333;
}
</style>