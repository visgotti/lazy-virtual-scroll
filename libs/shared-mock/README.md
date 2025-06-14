# Shared Mock Data

A utility library providing mock data generation and loading simulation for testing and demonstrating the Lazy Virtual Scroll components.

## Overview

This library provides utilities for generating mock datasets and simulating loading delays, useful for testing virtualized list components and creating realistic demo experiences.

## Features

- **Mock Data Generation**: Generate large datasets with configurable properties
- **Loading Simulation**: Simulate network delays for realistic loading experiences
- **TypeScript Support**: Full type definitions included
- **Configurable**: Customizable item properties and loading delays

## Usage

```typescript
import { 
  generateMockDatasets,
  loadDatasetWithDelay,
  type MockDataItem 
} from '@lazy-virtual-scroll/shared-mock';

// Generate a dataset starting at index 0 with 100 items
const dataset = generateMockDatasets(0, 100);

// Simulate loading with a delay
const loadData = async () => {
  try {
    const dataset = await loadDatasetWithDelay(0, 50, 500); // 500ms delay
    console.log('Loaded dataset:', dataset);
  } catch (error) {
    console.error('Failed to load:', error);
  }
};
```

## API

### `generateMockDatasets(startIndex: number, count: number): Dataset<MockDataItem>`

Generates a mock dataset with the specified starting index and item count.

**Parameters:**
- `startIndex`: The starting index for the dataset
- `count`: Number of items to generate

**Returns:** A `Dataset` object with mock data items

### `loadDatasetWithDelay(startIndex: number, count: number, delay?: number): Promise<Dataset<MockDataItem>>`

Simulates loading a dataset with an optional delay.

**Parameters:**
- `startIndex`: The starting index for the dataset
- `count`: Number of items to generate  
- `delay`: Optional delay in milliseconds (default: random between 100-800ms)

**Returns:** A Promise that resolves to a `Dataset` object

### Types

```typescript
interface MockDataItem {
  id: number;
  name: string;
  description: string;
  category: string;
  value: number;
  isActive: boolean;
  createdAt: Date;
}
```

## Building

Run `nx build shared-mock` to build the library.

## Running unit tests

Run `nx test shared-mock` to execute the unit tests via [Vitest](https://vitest.dev/).
