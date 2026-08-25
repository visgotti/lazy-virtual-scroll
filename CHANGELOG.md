# Changelog

All notable changes to the Lazy Virtual Scroll libraries will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-08-25

### Added
- **Data sources** (`createLazyDataSource`, `useLazyDataSource`): an opt-in row
  cache that fills the viewport, can index the whole list in the background off
  the critical path, and exposes it through an async API (`getItem`,
  `getRange`, `prefetch`, `scan`) for search, export and other non-rendering
  work.
- **IndexedDB storage** (`useIndexedDb`): spills rows off the heap so only the
  visible range plus buffer stays in memory. Every store method is async on
  both backends, so switching changes no calling code; falls back to memory
  when IndexedDB is unavailable. Session-scoped — wiped on open, deleted on
  dispose.
- **Background scanning** (`background`): idle-scheduled batches that yield to
  scrolling, skip ranges the viewport already loaded, and can be paused,
  resumed and monitored. Off by default, since opting in means fetching the
  whole list.
- Optional `source` prop on both `LazyVirtualScroll` components. Without it,
  behaviour is unchanged; with it, the list renders from the source and reports
  its viewport to it. `onLoad`/`@load` and `onHide`/`@hide` fire either way.
- Unit test targets for the React and Vue packages (`nx test
  @lazy-virtual-scroll/react`, `nx test @lazy-virtual-scroll/vue`), which
  previously had none.

### Changed
- `minItemSize` now applies to unmeasured items as well: they are estimated at
  the floor rather than the raw `itemSize`, so the scroll length no longer
  jumps as each one resolves, and the item wrapper carries a matching
  `min-height` / `min-width` so the browser enforces what the scroll maths
  assumes.

### Fixed
- Vue: `handleScroll` threw on every scroll when `autoDetectSizes` was off and
  no `dynamicSizes` prop was supplied — the prop defaults to `null` and
  `resolveIndexes` calls `Object.keys()` on it. Only the default-parameter path
  guarded `undefined`, so `null` fell through.
- Vue/React: `handleScroll` read the internal measured sizes rather than the
  combined `dynamicSizes` value, so a `dynamicSizes` prop passed with
  `autoDetectSizes` off was ignored.
- A background batch abandoned after its retries was offered back to the
  scanner forever, so a permanently failing range spun indefinitely and the
  rows past it were never fetched.
- A fetch that resolved after `invalidate()` wrote its rows back into the cache
  the caller had just cleared.
- The batch scanner could resurrect a worker orphaned by `stop()`, driving its
  active-worker count negative and leaving `whenBackgroundIdle()` unresolved.
- Growing `totalItems` after a background scan had finished never scanned the
  new rows.
- React: StrictMode's simulated unmount disposed the memoised source and the
  remount reused the dead instance, leaving the list stuck on its loading
  output.
- React: swapping the `source` prop left the list blank until the user
  scrolled, because the last reported viewport was never cleared.
- `core`: restored the `fillAndFlattenDatasets` and `mergeAdjacentDatasets`
  suites in `calcs.spec.ts`, pointing them at `utils/dataset.ts` where those
  functions now live. They had been importing from `./calcs` and failing 5 of
  9 since the move.

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
