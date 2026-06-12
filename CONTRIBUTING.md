# Contributing to AParticle

Thank you for your interest in contributing to **AParticle (Amuletcraft Particles)**! We welcome contributions of all kinds, including bug reports, feature requests, documentation improvements, and code changes.

Please take a moment to review this document to understand our development workflow and coding standards.

---

## How to Contribute

### 1. Reporting Bugs & Issues
If you find a bug, please check the existing issues on GitHub first. If the bug hasn't been reported yet:
- Open a new issue with a clear, descriptive title.
- Describe the exact steps needed to reproduce the issue.
- Describe the expected behavior and what actually happened.
- Provide any relevant server console warnings or error logs.

### 2. Suggesting Enhancements
If you have an idea for a new mathematical function, command, or performance improvement:
- Open an issue explaining your suggestion.
- Describe the use case and why this feature would be valuable to developers or players.

### 3. Submitting Pull Requests (PRs)
To submit code changes:
1.  **Fork** the repository and create a new branch from `main` (e.g., `feature/cool-new-shape` or `fix/pool-leak`).
2.  Write your code, following the **Coding Guidelines** below.
3.  Test your changes in a Minecraft Bedrock world.
4.  Commit your changes with clean, descriptive commit messages.
5.  Push your branch to your fork and open a Pull Request to our `main` branch.

---

## Coding Guidelines

Since this addon runs on Minecraft Bedrock's QuickJS script engine, performance and system constraints are crucial. Please adhere to the following guidelines:

### 1. Object Pooling Rules (Critical for Performance)
To keep particle rendering lag-free, we avoid dynamic memory allocations inside our ticking loops.
- **Vectors**: Always use `VectorPool.acquireVectorFrom(x, y, z)` instead of creating `{x, y, z}` objects in hot code paths. Release them immediately when done using `VectorPool.releaseVector(vec)`.
- **Arrays/Stacks**: Always use `StackPool.acquireArray()` for evaluation stacks or temporary arrays, and release them via `StackPool.releaseArray(arr)`.

### 2. World Mutations and Read-Only Contexts
- In Minecraft Bedrock scripting, command handlers (registered in `beforeEvents.startup`) run during a read-only phase of the game tick.
- If you write code that modifies the world state (e.g., setting world dynamic properties with `world.setDynamicProperty`), you **must** wrap it in `system.run(() => { ... })` to push the execution to the next tick.

### 3. Dynamic Properties & Whitelisting
- When adding settings or data fields, ensure they are whitelisted. Do not allow dynamic registry of arbitrary property keys on the world object to prevent save data bloat.

### 4. Code Style & Documentation
- Maintain JSDoc type comments above functions to assist static analyzers and IDE autocompletion.
- Keep the code modular. Core math logic belongs in `scripts/core/`, performance-related systems in `scripts/performance/`, and particle spawning systems in `scripts/features/`.

---

## Directory Structure

Here is a quick overview of where files are located:
- `manifest.json`: Behavior pack registration and version info.
- `scripts/main.js`: Bootstraps startup events and registers custom command handlers.
- `scripts/core/`:
  - `MathInterpreter.js`: Tokenizer, RPN converter, and math stack evaluator.
  - `ObjectPool.js`: Memory management pools for vectors and arrays.
  - `Registry.js`: Persistent storage cache for saved math functions/groups.
  - `Settings.js`: Global configuration settings.
- `scripts/features/`:
  - `Spawner.js`: Main parametric math equation execution generator loop.
  - `Matrix.js`: 3D linear algebra rotation transforms (handles caret coordinate alignment).
- `scripts/performance/`:
  - `Timeline.js`: Ticks generators asynchronously to prevent server TPS spikes.
  - `PerformanceMonitor.js`: Monitors tick budgets dynamically to adjust particle batch sizes.
- `scripts/utils/`:
  - `Logger.js`: Player action bar notifications and server log routing.

---

## Licensing
By contributing to this project, you agree that your contributions will be licensed under the project's [MIT License](./LICENSE).
