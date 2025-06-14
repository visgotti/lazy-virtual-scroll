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