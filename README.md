# Lazy Virtual Scroll

A monorepo containing high-performance virtualized list components for React and Vue that efficiently render large datasets with dynamic sizing, lazy loading, and bi-directional scrolling support.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Packages

This monorepo contains the following packages:

| Package | Description | NPM |
|---------|-------------|-----|
| [@lazy-virtual-scroll/react](libs/react-lazy-virtual-scroll/README.md) | Virtualized list component for React | [![npm version](https://img.shields.io/npm/v/@lazy-virtual-scroll/react.svg)](https://www.npmjs.com/package/@lazy-virtual-scroll/react) |
| [@lazy-virtual-scroll/vue](libs/vue-lazy-virtual-scroll/README.md) | Virtualized list component for Vue 3 | [![npm version](https://img.shields.io/npm/v/@lazy-virtual-scroll/vue.svg)](https://www.npmjs.com/package/@lazy-virtual-scroll/vue) |
| [core](libs/core/README.md) | Core utilities used by both React and Vue implementations | - |

## Features

- **Virtualized Rendering**: Only renders the items currently visible in the viewport
- **Dynamic Sizing**: Automatically detects and handles items of varying heights
- **Lazy Loading**: Load data on-demand as the user scrolls
- **Bi-directional Scrolling**: Support for both vertical and horizontal scrolling
- **Performance Optimized**: Debounced and throttled scroll handling
- **Flexible Data Structure**: Support for continuous or fragmented datasets
- **TypeScript Support**: Full type definitions included

## Quick Start

### React

```bash
npm install @lazy-virtual-scroll/react
```

```jsx
import LazyVirtualList from '@lazy-virtual-scroll/react';

<LazyVirtualList
  totalItems={10000}
  itemSize={50}
  data={items}
  render={(index, item) => (
    <div>{item ? item.text : 'Loading...'}</div>
  )}
/>
```

### Vue

```bash
npm install @lazy-virtual-scroll/vue
```

```vue
<LazyVirtualList
  :totalItems="10000"
  :itemSize="50"
  :data="items"
>
  <template #default="{ item, index }">
    <div>{{ item.text }}</div>
  </template>
  <template #loading="{ index }">
    <div>Loading...</div>
  </template>
</LazyVirtualList>
```

## Documentation

For complete documentation and examples, please refer to the README files for each package:

- [React Lazy Virtual Scroll Documentation](libs/react-lazy-virtual-scroll/README.md)
- [Vue Lazy Virtual Scroll Documentation](libs/vue-lazy-virtual-scroll/README.md)

## Examples

This repository includes demo applications for both React and Vue:

- React Demo: `apps/demo-react`
- Vue Demo: `apps/demo-vue`

To run the demos:

```bash
# React demo
npx nx serve demo-react

# Vue demo
npx nx serve demo-vue
```

## Development

This workspace is powered by [Nx](https://nx.dev).

### Building the packages

```bash
# Build all packages
npx nx run-many -t build

# Build specific package
npx nx build react-lazy-virtual-scroll
npx nx build vue-lazy-virtual-scroll
npx nx build core
```

### Running tests

```bash
# Test all packages
npx nx run-many -t test

# Test specific package
npx nx test react-lazy-virtual-scroll
npx nx test vue-lazy-virtual-scroll
npx nx test core
```

## License

MIT

Learn more about [code generators](https://nx.dev/features/generate-code) and [inferred tasks](https://nx.dev/concepts/inferred-tasks) in the docs.

## Running tasks

To execute tasks with Nx use the following syntax:

```
npx nx <target> <project> <...options>
```

You can also run multiple targets:

```
npx nx run-many -t <target1> <target2>
```

..or add `-p` to filter specific projects

```
npx nx run-many -t <target1> <target2> -p <proj1> <proj2>
```

Targets can be defined in the `package.json` or `projects.json`. Learn more [in the docs](https://nx.dev/features/run-tasks).

## Set up CI!

Nx comes with local caching already built-in (check your `nx.json`). On CI you might want to go a step further.

- [Set up remote caching](https://nx.dev/features/share-your-cache)
- [Set up task distribution across multiple machines](https://nx.dev/nx-cloud/features/distribute-task-execution)
- [Learn more how to setup CI](https://nx.dev/recipes/ci)

## Explore the project graph

Run `npx nx graph` to show the graph of the workspace.
It will show tasks that you can run with Nx.

- [Learn more about Exploring the Project Graph](https://nx.dev/core-features/explore-graph)

## Connect with us!

- [Join the community](https://nx.dev/community)
- [Subscribe to the Nx Youtube Channel](https://www.youtube.com/@nxdevtools)
- [Follow us on Twitter](https://twitter.com/nxdevtools)
