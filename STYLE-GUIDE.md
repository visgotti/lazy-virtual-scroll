# Lazy Virtual Scroll Style Guide

This document outlines the coding conventions and best practices for the Lazy Virtual Scroll libraries.

## General Guidelines

- **Type Safety**: Use TypeScript for all new code
- **Performance**: Prioritize performance optimizations for scroll handling and rendering
- **Consistency**: Maintain consistent APIs between React and Vue implementations
- **Documentation**: Document all public APIs with JSDoc comments

## Code Structure

### Core Library

- Keep the core library framework-agnostic
- Implement only calculation and data manipulation logic in core
- Export all types that are used by both implementations

### Framework Implementations

- Maintain similar prop/API structures between React and Vue implementations
- Handle framework-specific optimizations appropriately
- Use framework best practices (React hooks, Vue composition API)

## Naming Conventions

- **Variables and Functions**: Use camelCase
- **Types and Interfaces**: Use PascalCase
- **Constants**: Use UPPER_SNAKE_CASE for true constants
- **Private/Internal Functions**: Prefix with underscore (_functionName)

## Component Props/Options

Both implementations should support equivalent options:

- `totalItems`: Total number of items in the list
- `itemSize`: Base size of each item
- `data/datasets`: The data to render
- `direction`: Scrolling direction ('row'/'column')
- `dynamicSizes`: Manual overrides for item sizes
- `autoDetectSizes`: Flag to enable automatic size detection
- `scrollThrottle/scrollDebounce`: Performance optimization options

## Best Practices

### Performance

- Use memoization (useMemo in React, computed in Vue)
- Implement proper cleanup for observers and event listeners
- Avoid unnecessary re-renders/re-computations
- Use throttling and debouncing for scroll events

### Rendering

- Only render items in or near the visible viewport
- Implement proper calculation for scroll positioning
- Handle dynamic sizing with resize observers
- Maintain smooth scrolling experience

### State Management

- Keep state minimal and focused
- Use refs for values that shouldn't trigger re-renders
- Avoid deep nesting of state objects

## Testing

- Write unit tests for all core functionality
- Test edge cases (empty lists, very large lists, etc.)
- Test dynamic size handling
- Test scroll positioning and calculations

## Accessibility

- Ensure keyboard navigation works properly
- Add appropriate ARIA attributes
- Support screen readers appropriately
- Test with accessibility tools

## Browser Compatibility

- Support modern browsers (last 2 versions)
- Implement appropriate polyfills for ResizeObserver where needed
- Test in different browsers and devices
