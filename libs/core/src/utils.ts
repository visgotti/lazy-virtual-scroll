import type { Dataset } from './types';

export function generateMockDatasets(totalItems: number, itemsPerDataset: number): Dataset[] {
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