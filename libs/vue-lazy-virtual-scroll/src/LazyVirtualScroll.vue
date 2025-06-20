<template>
  <div class="scroll-outer" ref="scrollOuter" :style="scrollOuterStyleObject">
    <div
      class="scroll-inner"
      ref="scrollInner"
      :style="scrollInnerStyleObject"
    >
      <template v-if="autoDetectSizes">
        <div v-for="(item, index) in finalArray" :key="index" :style="listItemStyleObject" class="list-item" :ref="(el: HTMLElement | null) => el && setItemRef(index, el)">
          <slot name="default" v-if="item" :item="item" :index="startIndex + index"></slot>
          <slot name="loading" v-else :index="startIndex + index"></slot>
        </div>
      </template>
      <template v-else>
        <div v-for="(item, index) in finalArray" :key="index" class="list-item">
          <slot name="default" v-if="item" :item="item" :index="startIndex + index"></slot>
          <slot name="loading" v-else :index="startIndex + index"></slot>
        </div>
      </template>
     
    </div>
  </div>
</template>

<script lang="ts" setup>
import { resolveIndexes, utils, type Dataset } from '@core';
import { computed, ref, watch, defineProps, defineEmits, onMounted, onUnmounted, nextTick, toRefs } from 'vue';
import type { PropType, Ref } from 'vue';
import { useDebounceFn } from './useDebounceFn';
import { useThrottle } from './useThrottle';

const totalLength = ref(0);
const scrollLength = ref(0);
const scrollMargin = ref(0);
const startIndex = ref(0);
const endIndex = ref(0);
const scrollOuter: Ref<HTMLDivElement> = ref<HTMLDivElement>() as Ref<HTMLDivElement>;
const scrollInner: Ref<HTMLDivElement> = ref<HTMLDivElement>() as Ref<HTMLDivElement>;

// Track previous range for onHide callback
const prevRangeRef = ref<{ startIndex: number; endIndex: number } | null>(null);

const props = defineProps({
  totalItems: {
    type: Number,
    required: true,
  },
  itemSize: {
    type: Number,
    required: true,
  },
  scrollStart: {
    type: Number,
    default: 0,
  },
  scrollThrottle: {
    type: Number,
    default: 0
  },
  scrollDebounce: {
    type: Number,
    default: 0,
  },
  direction: {
    type: String as PropType<'row' | 'column'>,
    default: 'column',
  },
  sortDatasets: {
    type: Boolean,
    default: true,
  },
  data: {
    type: Array as PropType<any>,
    required: false,
  },
  datasets: {
    type: Array as PropType<Dataset[]>,
    required: false,
  },
  itemBuffer: {
    type: Number,
    default: 3,
  },
  minItemSize: {
    type: Number,
    default: 0
  },
  dynamicSizes: {
    type: Object as () => { [itemIndex: string]: number },
    default: null,
  },
  autoDetectSizes: {
    type: Boolean,
    default: false,
  },
  outerMaxLengthCssValue: {
    type: String,
    default: '100%'
  },
  outerMinLengthCssValue: {
    type: String,
    default: '100%'
  },
  outerLengthCssValue: {
    type: String,
    default: '100%'
  },
  listItemStyle: {
    type: Object as PropType<{ [key: string]: string }>,
    default: () => ({}),
  }
});


const { dynamicSizes, autoDetectSizes, direction, totalItems, datasets, data, sortDatasets } = toRefs(props);

if(props.scrollThrottle && props.scrollDebounce && props.scrollThrottle > props.scrollDebounce) {
  console.warn("Warning: The 'scrollDebounce' prop value is less than the 'scrollThrottle' prop value. This configuration is not recommended because if the debounce delay is shorter than the throttle delay, the debounce functionality becomes redundant. Please set 'scrollDebounce' to be equal to or greater than 'scrollThrottle' to ensure both functionalities work as intended.");
}

const clientLengthProp = computed(() => direction.value === 'column' ? 'clientHeight' : 'clientWidth');
const lengthProp = computed(() => direction.value === 'column' ? 'height' : 'width');
const scrollProp = computed(() => direction.value === 'column' ? 'scrollTop' : 'scrollLeft');
const marginProp = computed(() => direction.value === 'column' ? 'marginTop' : 'marginLeft');
const marginProp2 = computed(() => direction.value === 'column' ? 'marginBottom' : 'marginRight');

const shouldSortDatasets = computed(() => {
  return datasets?.value?.length && sortDatasets.value;
});

const internalDynamicSizes = ref<{ [key: number]: number }>({});

if(dynamicSizes.value && autoDetectSizes.value) {
  internalDynamicSizes.value = {
    ...dynamicSizes.value,
  }
}
const dynamicSizesRef = computed(() => {
  return autoDetectSizes.value ? internalDynamicSizes.value : dynamicSizes.value;
});

watch([dynamicSizesRef, totalItems], () => {
  handleScroll();
}, { deep: true });

const orderedDatasets = computed(() => {
  const datasetsEnsured = datasets?.value 
    ? datasets.value
    : [{ 
      startingIndex: 0, 
      data: data?.value || []
     }];

  if (!shouldSortDatasets.value) {
    return datasetsEnsured;
  } 
  return datasetsEnsured.sort((a, b) => a.startingIndex - b.startingIndex);
});

const finalArray = computed(() => {
  return utils.fillAndFlattenDatasets({
    orderedDatasets: orderedDatasets.value,
    startIndex: startIndex.value,
    endIndex: endIndex.value,
  });
});

const handleScroll = (e?: any) => {
  if (!scrollOuter.value) return;
  const resolved = resolveIndexes({
    scrollTop: scrollOuter.value[scrollProp.value],
    viewHeight: scrollOuter.value[clientLengthProp.value],
    ...props,
    dynamicSizes: dynamicSizesRef.value,
  });

  totalLength.value = resolved.totalItemHeight;
  scrollMargin.value = scrollOuter.value[scrollProp.value] - resolved.scrollTopPadding;
  scrollLength.value = totalLength.value - scrollMargin.value;
  
  if (resolved.startIndex !== startIndex.value || resolved.endIndex !== endIndex.value) {
    const prevRange = prevRangeRef.value;
    
    // Calculate hidden ranges when items go out of view
    if (prevRange !== null) {
      // Items hidden at the beginning (scrolled down past them)
      if (resolved.startIndex > prevRange.startIndex) {
        const hiddenStartIndex = prevRange.startIndex;
        const hiddenEndIndex = Math.min(prevRange.endIndex, resolved.startIndex - 1);
        if (hiddenEndIndex >= hiddenStartIndex) {
          emit('hide', { startIndex: hiddenStartIndex, endIndex: hiddenEndIndex });
        }
      }
      
      // Items hidden at the end (scrolled up past them)
      if (resolved.endIndex < prevRange.endIndex) {
        const hiddenStartIndex = Math.max(prevRange.startIndex, resolved.endIndex + 1);
        const hiddenEndIndex = prevRange.endIndex;
        if (hiddenEndIndex >= hiddenStartIndex) {
          emit('hide', { startIndex: hiddenStartIndex, endIndex: hiddenEndIndex });
        }
      }
    }
    
    startIndex.value = resolved.startIndex;
    endIndex.value = resolved.endIndex;
    prevRangeRef.value = { startIndex: resolved.startIndex, endIndex: resolved.endIndex };
    
    emit('load', {
      startIndex: startIndex.value,
      endIndex: endIndex.value,
    });
  }
};

const emit = defineEmits<{
  (e: 'scroll', value: number): void;
  (e: 'load', value: { startIndex: number; endIndex: number }): void;
  (e: 'hide', value: { startIndex: number; endIndex: number }): void;
}>();

// Use refs to make throttle and debounce values reactive
const scrollThrottleRef = computed(() => props.scrollThrottle || 0);
const scrollDebounceRef = computed(() => props.scrollDebounce || 0);

// Create throttled and debounced functions using the reactive refs
const throttledScrollFn = useThrottle(handleScroll, scrollThrottleRef, computed(() => scrollDebounceRef.value || scrollThrottleRef.value));
const debouncedScrollFn = useDebounceFn(handleScroll, scrollDebounceRef);

// Create a computed property that will automatically update when throttle/debounce changes
const debouncedScroll = computed(() => {
  if (scrollDebounceRef.value > 0) {
    return debouncedScrollFn;
  } else if (scrollThrottleRef.value > 0) {
    return throttledScrollFn;
  } else {
    return handleScroll;
  }
});

// Create wrapper handler functions
const handleScrollEvent = () => debouncedScroll.value();
const handleResizeEvent = () => debouncedScroll.value();

onMounted(() => {
  window.addEventListener('scroll', handleScrollEvent);
  window.addEventListener('resize', handleResizeEvent);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScrollEvent);
  window.removeEventListener('resize', handleResizeEvent);
  Object.values(resizeObservers).forEach(({ observer }) => observer.disconnect());
  resetOuterObserver();
});

watch(scrollOuter, (v) => {
  if (!v) {
    return;
  }
  initOuterObserver();
  scrollOuter.value.onscroll = () => {
    debouncedScroll.value();
    emit('scroll', scrollOuter.value[scrollProp.value])
  };
  nextTick(() => {
    if(!scrollOuter.value) { return; }
    handleScroll();
    if(!props.scrollStart) {
      return;
    }
    nextTick(() => {
      scrollOuter.value[scrollProp.value] = props.scrollStart;
      handleScroll();
    });
  });
});

const scrollOuterStyleObject = computed(() => {
  const obj : { 
    width?: string,
    height?: string, 
    'max-width'?: string,
    'max-height'?: string,
    'min-width'?: string,
    'min-height'?: string,
  } = {};
  if(props.outerLengthCssValue) {
    obj[lengthProp.value] = props.outerLengthCssValue;
  }
  if(props.outerMinLengthCssValue) {
    obj[`min-${lengthProp.value}`] = props.outerMinLengthCssValue;
  }
  if(props.outerMaxLengthCssValue) {
    obj[`max-${lengthProp.value}`] = props.outerMaxLengthCssValue;
  }
  return utils.scrollOuterStyle(lengthProp.value, obj);
});

const listItemStyleObject = computed(() => ({
  display: 'inline-block',
  ...(props.listItemStyle || {}),
}))

const lastTotalItems = ref(0);
watch(props, () => {
  if(props.totalItems !== lastTotalItems.value) {
    lastTotalItems.value = props.totalItems;
    handleScroll();
  }
}, { deep: true });

const scrollInnerStyleObject = computed(() => {
  return utils.scrollInnerStyle(scrollLength.value, scrollMargin.value, direction.value)
});
const resizeObservers: {[index: string]: { el: HTMLElement, observer: ResizeObserver } } = {}

let outerResizeObserver : ResizeObserver | null = null;

const resetOuterObserver = () => {
  outerResizeObserver?.disconnect(); 
  outerResizeObserver = null;
}
const initOuterObserver = () => {
  resetOuterObserver();
  if(!scrollOuter.value) {
    return;
  }
  outerResizeObserver = new ResizeObserver(handleScroll);
  outerResizeObserver.observe(scrollOuter.value);
}

watch([startIndex, endIndex], () => {
  Object.keys(resizeObservers).forEach((key) => {
    const observerIndex = parseInt(key);
    if (observerIndex >= startIndex.value && observerIndex <= endIndex.value) {
     return;
    }
    resizeObservers[key].observer.disconnect();
    delete resizeObservers[key];
  });
});

const setItemRef = (index: number, el: HTMLElement) => {
  if (el && autoDetectSizes.value) {
    const finalIndex = startIndex.value + index;
    const computeLength = () => {
      const length = el.getBoundingClientRect()[lengthProp.value];
      const style = window.getComputedStyle(el);
      const margin1 = parseFloat(style[marginProp.value]);
      const margin2 = parseFloat(style[marginProp2.value]);
      const finalLength = Math.max(length + margin1 + margin2, props.minItemSize);
      if(finalLength !== props.itemSize) {
        internalDynamicSizes.value[finalIndex] = finalLength;
      } else {
        delete internalDynamicSizes.value[finalIndex];
      }
    }
    nextTick(() => {
      computeLength();
      const existingObserver = resizeObservers[finalIndex];
      if (existingObserver) {
        if(existingObserver.el === el) {
          return;
        }
        existingObserver.observer.disconnect();
        delete resizeObservers[finalIndex];
      }
      resizeObservers[finalIndex] = { observer: new ResizeObserver(computeLength), el }
    })
  }
};
</script>

