# Changelog

All notable changes to the Lazy Virtual Scroll libraries will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-06-16

### Changed
- **Breaking:** the component exported by both packages is now named `LazyVirtualScroll`
  (was `LazyVirtualList`), matching the library name. The React prop type is now
  `VirtualLazyScrollProps` (was `VirtualListProps`). The default export is unchanged, so
  `import LazyVirtualScroll from '@lazy-virtual-scroll/react'` keeps working under any local
  name; only named imports of `LazyVirtualList` / `VirtualListProps` need updating.
- Improved prop reactivity in the React and Vue demos.
- `scrollThrottle` / `scrollDebounce` changes now take effect without remounting.
- Each package's README is copied into its published dist.

## [1.0.0] - 2025-06-12

### Added
- Initial release of @lazy-virtual-scroll/react
- Initial release of @lazy-virtual-scroll/vue
- Core library with shared functionality
- Support for vertical and horizontal scrolling
- Dynamic size detection
- Support for fragmented datasets
- Performance optimizations with throttling and debouncing
- Demo applications for both React and Vue

### React Implementation
- LazyVirtualList component with full TypeScript support
- Support for custom item rendering
- Loading state rendering
- Auto-detection of item sizes
- Scroll event handling with throttling and debouncing

### Vue Implementation
- LazyVirtualList component for Vue 3
- Named slots for item and loading state rendering
- Support for dynamic sizing
- Scroll event handling with optimizations
- TypeScript support

## Future Plans

### Upcoming Features
- Improved accessibility support
- Additional performance optimizations
- Better handling of window resize events
- More comprehensive documentation and examples
- Additional customization options
- Support for sticky headers and footers
- Grouping functionality
