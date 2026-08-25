# Shared Mock Data

A utility library providing mock data generation and loading simulation for testing and demonstrating the Lazy Virtual Scroll components.

> **Internal package.** `shared-mock` is `private: true` and is not published to npm. Inside this
> workspace it resolves through the `shared-mock` / `@lazy-virtual-scroll/shared-mock` tsconfig
> path aliases.

## Overview

This library provides utilities for generating mock datasets and simulating loading delays, useful for testing virtualized list components and creating realistic demo experiences.

## Features

- **Mock Data Generation**: Generate items and pre-chunked datasets
- **Loading Simulation**: Simulate network delays for realistic loading experiences
- **TypeScript Support**: Full type definitions included

## Usage

```typescript
import {
  generateMockItems,
  generateMockDatasets,
  loadDatasetWithDelay,
  type MockDataItem
} from 'shared-mock';

// 1000 items split into datasets of 25 -> 40 Dataset chunks
const datasets = generateMockDatasets(1000, 25);

// Simulate loading one chunk of 50 items starting at index 0, with a 500ms delay
const loadData = async () => {
  const dataset = await loadDatasetWithDelay(0, 50, 500);
  console.log('Loaded dataset:', dataset);
};
```

## API

### `generateMockItems(count: number, startIndex?: number): MockDataItem[]`

Generates `count` mock items, named from `startIndex` onward.

**Parameters:**
- `count`: Number of items to generate
- `startIndex`: Index the first item's name is based on (default `0`)

### `generateMockDatasets(totalItems: number, itemsPerDataset?: number): Dataset[]`

Splits `totalItems` items into contiguous `Dataset` chunks.

**Parameters:**
- `totalItems`: Total number of items to generate across all datasets
- `itemsPerDataset`: Chunk size (default `10`)

**Returns:** An array of `Dataset` objects covering `0 .. totalItems - 1`

### `loadDatasetWithDelay(startingIndex: number, itemCount: number, delay?: number): Promise<Dataset<MockDataItem>>`

Generates one dataset and resolves it after a delay.

**Parameters:**
- `startingIndex`: The starting index for the dataset
- `itemCount`: Number of items to generate
- `delay`: Delay in milliseconds (default: `getRandomLoadingDelay()`, i.e. 500–1500ms)

### `getRandomLoadingDelay(): number`

Returns a random delay between 500ms and 1500ms.

### `createDelayedPromise<T>(data: T, delay?: number): Promise<T>`

Resolves `data` after `delay` ms, defaulting to `getRandomLoadingDelay()`.

### `createLoadingState(resolveTime?: number): LoadingState`

Creates a loading tracker stamped with `Date.now()`. `resolveTime` defaults to
`Date.now() + getRandomLoadingDelay()`.

### `shouldResolveLoading(loadingState: LoadingState): boolean`

Returns `true` once `Date.now()` has passed the state's `resolveTime`.

### Types

```typescript
interface MockDataItem {
  name: string;
  isExpanded: boolean;
  loadingTime?: number;
}

interface LoadingState {
  isLoading: boolean;
  startTime: number;
  resolveTime: number;
}
```

## Building

Run `nx build shared-mock` to build the library.

## Running unit tests

Run `nx test shared-mock` to execute the unit tests via [Vitest](https://vitest.dev/).
