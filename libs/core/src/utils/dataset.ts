import type { Dataset, LoadEventPayload } from '../types';

// Utility functions can be added here as needed

export const splitLoadEventBasedOnAlreadyLoaded = (event: LoadEventPayload, isLoaded: (itemIndex: number) => boolean): Array<LoadEventPayload> => {
  const loadEvents: LoadEventPayload[] = [];
  let currentStartIndex: number | null = null;
  
  for (let i = event.startIndex; i <= event.endIndex; i++) {
    if (!isLoaded(i)) {
      // Item is not loaded, start or continue a load event
      if (currentStartIndex === null) {
        currentStartIndex = i;
      }
    } else {
      // Item is already loaded, end current load event if one exists
      if (currentStartIndex !== null) {
        loadEvents.push({
          startIndex: currentStartIndex,
          endIndex: i - 1
        });
        currentStartIndex = null;
      }
    }
  }
  
  // Handle case where we end with unloaded items
  if (currentStartIndex !== null) {
    loadEvents.push({
      startIndex: currentStartIndex,
      endIndex: event.endIndex
    });
  }
  if(!loadEvents.length) {
    loadEvents.push({
      ...event,
    });
  }
  return loadEvents;
}

export const flattenDatasets = <T=unknown>(datasets: Dataset<T>[], sortFirst=true): ({ itemIndex: number, itemData: T })[] => {
  if(sortFirst) {
    datasets.sort((a, b) => a.startingIndex - b.startingIndex);
  }
  return datasets.flatMap((dataset) => 
    dataset.data.map((itemData, index) => ({
      itemIndex: dataset.startingIndex + index,
      itemData
    }))
  );
}

interface FillAndFlattenDatasetsParams {
  orderedDatasets: Dataset[];
  startIndex: number;
  endIndex: number;
}
export const fillAndFlattenDatasets = ({
  orderedDatasets,
  startIndex,
  endIndex,
}: FillAndFlattenDatasetsParams): Array<any | null> => {
  const items: Array<any | null> = new Array(endIndex - startIndex + 1).fill(null);
  for (let i = 0; i < orderedDatasets.length; i++) {
    const { startingIndex, data } = orderedDatasets[i];
    const datasetEndingIndex = startingIndex + data.length - 1;

    // Definitely no more items to be found if starting index of the dataset is greater than the end visible index
    if (startingIndex > endIndex) {
      return items;
    }

    // Skip datasets that are completely before the visible range
    if (datasetEndingIndex < startIndex) {
      continue;
    }
    
    for (let j = 0; j < data.length; j++) {
      const itemIndex = startingIndex + j;
      // If the item falls within the visible range, set it in the items array
      if (itemIndex >= startIndex && itemIndex <= endIndex) {
        items[itemIndex - startIndex] = data[j];
      }
    }
  }
  return items;
};


export const indexIsLoaded = (itemIndex: number, datasets: Dataset[]): boolean => {
  return datasets.some(dataset => {
    const datasetEndIndex = dataset.startingIndex + dataset.data.length - 1;
    return itemIndex >= dataset.startingIndex && itemIndex <= datasetEndIndex;
  });
}


export function mergeAdjacentDatasets(datasets: Dataset[], sortFirst=true): Dataset[] {
  if (datasets.length === 0) return datasets;
  if(sortFirst) {
    datasets.sort((a, b) => a.startingIndex - b.startingIndex);
  }

  const mergedDatasets: Dataset[] = [];
  let currentMerged: Dataset = { startingIndex: datasets[0].startingIndex, data: [...datasets[0].data] };

  for (let i = 1; i < datasets.length; i++) {
    const current = datasets[i];

    if (currentMerged.startingIndex + currentMerged.data.length >= current.startingIndex) {
      const overlap = current.startingIndex - currentMerged.startingIndex;
      const nonOverlappingPart = current.data.slice(Math.max(0, currentMerged.data.length - overlap));
      currentMerged.data = currentMerged.data.concat(nonOverlappingPart);
    } else {
      mergedDatasets.push(currentMerged);
      currentMerged = { startingIndex: current.startingIndex, data: [...current.data] };
    }
  }
  mergedDatasets.push(currentMerged);
  return mergedDatasets;
}
