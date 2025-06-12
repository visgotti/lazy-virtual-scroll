# Contributing to Lazy Virtual Scroll

Thank you for your interest in contributing to the Lazy Virtual Scroll libraries! This document outlines the process for contributing to this project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Install dependencies**
   ```bash
   npm install
   ```

## Development Workflow

This project uses [Nx](https://nx.dev/) to manage the monorepo structure. Here are some common commands:

### Running demos

The easiest way to get started is to run one of the demo applications:

```bash
# React demo
npx nx serve demo-react

# Vue demo
npx nx serve demo-vue
```

### Building packages

```bash
# Build vue
npm run build:vue

# Build react
npm run build:react
```

### Running tests

Currently, we have tests for the core library:

```bash
# Run tests for core library
npx nx test core
```

## Project Structure

- `/libs/core`: Contains shared utility functions used by both implementations
- `/libs/react-lazy-virtual-scroll`: React implementation (@lazy-virtual-scroll/react)
- `/libs/vue-lazy-virtual-scroll`: Vue implementation (@lazy-virtual-scroll/vue)
- `/apps/demo-react`: Demo app for React implementation
- `/apps/demo-vue`: Demo app for Vue implementation

## Making Changes

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes, following these guidelines:
   - Write clear, readable, and maintainable code
   - Include appropriate tests for your changes
   - Update documentation as needed
   - Follow existing code style and conventions

3. Commit your changes with descriptive commit messages

4. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

5. Open a pull request against the `main` branch of the original repository

## Reporting Issues

When reporting issues, please include:

1. A clear description of the issue
2. Steps to reproduce
3. Expected vs. actual behavior
4. Version information (library version, framework version, browser/environment)
5. Any relevant code snippets or error messages

## Pull Request Guidelines

- Keep PRs focused on a single change or feature
- Add tests for any new functionality
- Update documentation to reflect changes
- Ensure all tests pass
- Squash related commits before merging

## Code Style

- Follow the existing code style and patterns in the repository
- Use TypeScript where possible
- Write clear, self-documenting code with descriptive variable names
- Add comments for complex logic

## License

By contributing to this project, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).

Thank you for your contributions!
