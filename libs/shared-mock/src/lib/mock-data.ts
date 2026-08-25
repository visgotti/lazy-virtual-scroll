import { Dataset } from '@lazy-virtual-scroll/core';

/**
 * Mock data item interface
 */
export interface MockDataItem {
  name: string;
  isExpanded: boolean;
  loadingTime?: number;
}

/**
 * Loading state for mock data
 */
export interface LoadingState {
  isLoading: boolean;
  startTime: number;
  resolveTime: number;
}

/**
 * Generates random loading delay between 500ms and 1.5s
 */
export function getRandomLoadingDelay(): number {
  return Math.random() * 1000 + 500; // 500ms to 1.5s
}

/**
 * Creates a promise that resolves after a random delay
 */
export function createDelayedPromise<T>(data: T, delay?: number): Promise<T> {
  const loadingDelay = delay ?? getRandomLoadingDelay();
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), loadingDelay);
  });
}

/**
 * Generates mock data items with random loading times
 */
export function generateMockItems(count: number, startIndex: number = 0): MockDataItem[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `Item ${startIndex + i}`,
    isExpanded: false,
    loadingTime: getRandomLoadingDelay()
  }));
}

/**
 * Generates mock datasets with loading delays
 */
export function generateMockDatasets(totalItems: number, itemsPerDataset: number = 10): Dataset[] {
  const datasets: Dataset[] = [];

  for (let i = 0; i < totalItems; i += itemsPerDataset) {
    const remainingItems = Math.min(itemsPerDataset, totalItems - i);
    const data = generateMockItems(remainingItems, i);
    
    datasets.push({
      startingIndex: i,
      data,
    });
  }
  
  return datasets;
}

/**
 * Simulates loading a dataset with a delay
 */
export async function loadDatasetWithDelay(
  startingIndex: number, 
  itemCount: number, 
  delay?: number
): Promise<Dataset<MockDataItem>> {
  const data = generateMockItems(itemCount, startingIndex);
  return createDelayedPromise({
    startingIndex,
    data
  }, delay);
}

/**
 * Creates a loading state tracker
 */
export function createLoadingState(resolveTime?: number): LoadingState {
  return {
    isLoading: true,
    startTime: Date.now(),
    resolveTime: resolveTime ?? Date.now() + getRandomLoadingDelay()
  };
}

/**
 * Checks if loading state should be resolved
 */
export function shouldResolveLoading(loadingState: LoadingState): boolean {
  return Date.now() >= loadingState.resolveTime;
}

/**
 * Lorem ipsum sentences used for the demos' expanded-item body copy.
 */
const LOREM_SENTENCES = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.',
  'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.',
  'Curabitur pretium tincidunt lacus, nulla gravida orci a odio.',
  'Nullam varius, turpis et commodo pharetra, est eros bibendum elit.',
  'Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci.',
];

/**
 * Deterministic lorem ipsum body copy for an item — same index always yields the
 * same text, so it stays stable across re-renders and matches between demos.
 */
export function getLoremText(index: number, sentenceCount = 4): string {
  return Array.from(
    { length: sentenceCount },
    (_, i) => LOREM_SENTENCES[(index + i) % LOREM_SENTENCES.length]
  ).join(' ');
}
