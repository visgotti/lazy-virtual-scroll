import { ref, computed } from 'vue';
import { type Dataset, type LoadEventPayload } from '@lazy-virtual-scroll/vue';
import { 
  type ScrollProps,
  defaultScrollProps
} from '@lazy-virtual-scroll/core';
import { 
  loadDatasetWithDelay
} from '@lazy-virtual-scroll/shared-mock';

export const useVirtualListDemo = (initialProps: Partial<ScrollProps> = {}) => {
  // Initialize with default values from core
  const initialScrollProps: ScrollProps = {
    ...defaultScrollProps,
    totalItems: 300,
    ...initialProps
  };
  const scrollProps = ref<ScrollProps>({ ...initialScrollProps });
  const openItems = ref<{ [itemIndex: string]: number }>({});
  const loadedDatasets = ref<Dataset<object>[]>([]);
  const itemShowCounts = ref<{ [key: number]: number }>({});
  const hiddenItems = ref<Set<number>>(new Set());
  // Size the item grows to along the scroll axis when expanded (height for a
  // column, width for a row) - this is what the library tracks via dynamicSizes.
  const expandedItemSize = 500;

  const datasets = computed(() => loadedDatasets.value);

  const formattedDatasets = computed(() => {
    return datasets.value.map((d: Dataset<object>) => ({
      startingIndex: d.startingIndex,
      data: d.data.map((item: any, i: number) => {
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
        [index]: expandedItemSize
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
    loadDatasetWithDelay(startIndex, itemCount, 5000)
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

  return {
    scrollProps,
    initialScrollProps,
    openItems,
    formattedDatasets,
    handleToggleExpand,
    handleLoad,
    handleHide,
    uniqueLoadedItemsCount
  };
};
