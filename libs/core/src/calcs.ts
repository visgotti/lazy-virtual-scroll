import type { Dataset } from "./types";

interface ResolveIndexesParams {
  scrollTop: number;
  viewHeight: number;
  itemSize: number;
  totalItems: number;
  itemBuffer: number;
  dynamicSizes?: { [index: string]: number };
}

interface ResolveIndexesResult {
  startIndex: number;
  endIndex: number;
  totalItemHeight: number;
  scrollTopPadding: number;
}

interface FillItemArrayParams {
  orderedDatasets: Dataset[];
  startIndex: number;
  endIndex: number;
}

export const fillItemArray = ({
  orderedDatasets,
  startIndex,
  endIndex,
}: FillItemArrayParams): Array<any | null> => {
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

export const resolveIndexes = ({
  scrollTop,
  viewHeight,
  itemSize,
  totalItems,
  itemBuffer,
  dynamicSizes = {},
}: ResolveIndexesParams): ResolveIndexesResult => {
  const getItemHeight = (index: number) => {
    return index in dynamicSizes ? dynamicSizes[index] : itemSize;
  };

  let offset = 0;
  let startVisibleIndex = 0;

  const dynamicSized = Object.keys(dynamicSizes);
  const unresizedItemHeights =  itemSize * (totalItems - dynamicSized.length);
  const resizedItemHeights = dynamicSized.reduce((pv, cv) =>  pv + dynamicSizes[cv], 0);
  const totalItemHeight = unresizedItemHeights + resizedItemHeights;

  let startVisiblePosition = 0;

  for (let i = 0; i < totalItems; i++) {
    const itemHeight = getItemHeight(i);
    const next = offset + itemHeight;
    if (next > scrollTop) {
      startVisibleIndex = i;
      startVisiblePosition = next - (next-scrollTop);
      break;
    }
    offset = next;
  }
  const startVisibleElementPosition = offset - scrollTop; 

  offset = startVisibleElementPosition;

  let endVisibleIndex = startVisibleIndex;
  for (let i = startVisibleIndex; i < totalItems; i++) {
    const itemHeight = getItemHeight(i);
    const next = offset + itemHeight;
    if (next >= viewHeight) {
      endVisibleIndex = i;
      break;
    }
    offset = next;
  }

  const startIndex = Math.max(startVisibleIndex - itemBuffer, 0);
  const endIndex = Math.min(endVisibleIndex + itemBuffer, totalItems - 1);

  let scrollTopPadding = Math.abs(startVisibleElementPosition);

  for(let i = startVisibleIndex-1; i >= startIndex; i--) {
    scrollTopPadding += getItemHeight(i);
  }

  return {
    scrollTopPadding,
    totalItemHeight,
    startIndex,
    endIndex,
  };
};

export function mergeAdjacentDatasets(datasets: Dataset[]): Dataset[] {
  if (datasets.length === 0) return datasets;
  datasets.sort((a, b) => a.startingIndex - b.startingIndex);

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
