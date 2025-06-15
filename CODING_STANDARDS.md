# Enforcing Coding Standards with GitHub Copilot

## Overview

This guide explains how to enforce coding standards with GitHub Copilot in the Soul Recycling Simulation project. Our toolchain automatically ensures code quality through TypeScript, ESLint, and Prettier integration.

## 🚀 Quick Setup

### 1. **Install VS Code Extensions**

```bash
# Required extensions for optimal Copilot integration
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension svelte.svelte-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension GitHub.copilot
code --install-extension GitHub.copilot-chat
```

### 2. **Run Code Quality Checks**

```bash
# Check TypeScript compilation
npm run type-check

# Check code style and fix issues
npm run lint:fix

# Format code automatically
npm run format

# Run all checks at once
npm run check
```

## 🎯 How Copilot Learns from Your Standards

### 1. **ESLint Integration**

Copilot reads your ESLint configuration and generates code that follows your rules:

- **Naming conventions**: PascalCase for interfaces, camelCase for functions
- **Code style**: Curly braces required, single quotes, semicolons
- **TypeScript rules**: No implicit any, explicit function return types
- **Unused variables**: Prevents creation of unused code

### 2. **TypeScript Type System**

Strong typing helps Copilot understand your intentions:

```typescript
// Good: Copilot understands the expected structure
interface SoulData {
  id: number;
  type: 'human' | 'gpt' | 'dewa';
  position: THREE.Vector3;
}

// Copilot will generate code that respects these types
function createSoul(data: SoulData): THREE.Mesh {
  // Copilot suggestions will use correct properties
}
```

### 3. **Prettier Formatting**

Automatic formatting ensures consistent style:

- **Indentation**: 2 spaces consistently
- **Quotes**: Single quotes for strings
- **Line length**: 100 characters maximum
- **Trailing commas**: ES5-compatible

## 💡 Best Practices for Copilot Code Generation

### 1. **Write Descriptive Comments**

```typescript
// Create a new soul with realistic physics properties and visual characteristics
// The soul should have proper collision detection and lifespan management
// Returns a THREE.Mesh with complete userData for simulation
function createRealisticSoul(config: SoulCreationConfig): THREE.Mesh {
  // Copilot will generate implementation following this guidance
}
```

### 2. **Use Consistent Naming Patterns**

```typescript
// Copilot learns from existing patterns
export class AdaptivePerformanceManager {}
export class LODManager {}
export class InstancedSoulRenderer {}

// Copilot will suggest similar patterns for new classes
export class QualityController {} // ✅ Follows pattern
```

### 3. **Leverage Type Definitions**

```typescript
// Define clear interfaces that guide Copilot
interface PhysicsUpdateMessage {
  type: 'PHYSICS_UPDATE';
  data: {
    souls: SoulData[];
    deltaTime: number;
    mousePosition: { x: number; y: number };
  };
}

// Copilot will respect this structure in generated code
```

### 4. **Establish Code Organization Patterns**

```typescript
// File structure patterns that Copilot recognizes
// 1. Imports (grouped: built-in, external, internal)
import { onMount } from 'svelte';
import * as THREE from 'three';
import type { SoulData } from '$lib/types';

// 2. Type definitions
interface ComponentProps {
  souls: SoulData[];
}

// 3. Implementation
export function createComponent(props: ComponentProps) {
  // Implementation
}
```

## 🔧 Toolchain Configuration

### ESLint Rules That Guide Copilot

```javascript
// eslint.config.js enforces:
{
  '@typescript-eslint/no-unused-vars': 'error',      // Prevents unused code
  '@typescript-eslint/no-explicit-any': 'warn',      // Encourages proper typing
  'prefer-const': 'error',                           // Modern JavaScript
  'curly': ['error', 'all'],                         // Consistent braces
  'eqeqeq': ['error', 'always'],                     // Strict equality
}
```

### TypeScript Configuration

```json
// tsconfig.json settings that improve Copilot suggestions:
{
  "strict": true, // Strict type checking
  "noImplicitAny": true, // Explicit types required
  "strictNullChecks": true, // Null safety
  "noImplicitReturns": true // Return type safety
}
```

### Prettier Configuration

```json
// .prettierrc settings that Copilot respects:
{
  "singleQuote": true, // Consistent quote style
  "tabWidth": 2, // 2-space indentation
  "printWidth": 100, // Line length limit
  "trailingComma": "es5" // Trailing comma style
}
```

## 🎮 Interactive Copilot Workflows

### 1. **Using Copilot Chat for Standards**

```
@workspace How should I implement a new performance monitoring class following the existing patterns in this codebase?
```

### 2. **Code Review with Copilot**

```
@workspace Review this function for compliance with our TypeScript and ESLint standards:
[paste your code]
```

### 3. **Refactoring Assistance**

```
@workspace Refactor this JavaScript function to TypeScript following our naming conventions and type safety requirements
```

## 📋 Pre-commit Workflow

### Automated Quality Gates with Husky

We use Husky and lint-staged to automatically enforce code quality before commits:

```bash
# Installation (already configured)
npm install --save-dev husky lint-staged
npx husky init
```

### Pre-commit Hook Configuration

Every commit automatically runs:

1. **ESLint with auto-fix** on TypeScript, JavaScript, and Svelte files
2. **Prettier formatting** on all supported files
3. Only processes staged files for optimal performance

```json
// package.json lint-staged configuration
{
  "lint-staged": {
    "*.{ts,js,svelte}": ["npm run lint:fix", "npm run format"],
    "*.{json,md,css,scss}": ["npm run format"]
  }
}
```

### What Happens on Commit

```bash
# When you run: git commit -m "your message"
# Husky automatically runs:
1. ✅ ESLint fixes code issues on staged files
2. ✅ Prettier formats all staged files
3. ✅ Re-stages the fixed files
4. ✅ Proceeds with commit if no errors

# If there are unfixable ESLint errors:
❌ Commit is blocked until issues are resolved
```

### Manual Quality Check Commands

```bash
# Run the same checks manually on staged files
npx lint-staged

# Or run checks on all files
npm run check

# Run individual checks
npm run lint:fix
npm run format
npm run type-check
```

### Legacy Manual Workflow

```bash
# Manual workflow (still available)
#!/bin/bash
echo "🔍 Running code quality checks..."

# 1. Type checking
npm run type-check || exit 1

# 2. Linting with auto-fix
npm run lint:fix || exit 1

# 3. Format code
npm run format

# 4. Final validation
npm run check || exit 1

echo "✅ Code quality checks passed!"
```

### VS Code Integration

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "github.copilot.enable": {
    "*": true
  }
}
```

## 🚫 Common Copilot Anti-patterns to Avoid

### 1. **Don't Override Standards in Comments**

```typescript
// ❌ Bad: Asking Copilot to ignore standards
// Generate code without TypeScript types

// ✅ Good: Work with the standards
// Generate a typed function that validates soul data
```

### 2. **Don't Mix Coding Styles**

```typescript
// ❌ Bad: Inconsistent with existing code
function create_soul() {
  return {};
}

// ✅ Good: Follows established patterns
function createSoul(): SoulData {}
```

### 3. **Don't Skip Type Definitions**

```typescript
// ❌ Bad: Copilot can't understand intent
function processData(data: any) {}

// ✅ Good: Clear type information
function processSoulData(data: SoulData[]): ProcessedSoulData {}
```

## 📊 Measuring Standards Compliance

### Metrics to Track

- **TypeScript errors**: `npm run type-check` should show 0 errors
- **ESLint violations**: `npm run lint` should pass cleanly
- **Format consistency**: `npm run format:check` should pass
- **Code coverage**: Type coverage and test coverage

### Quality Dashboard Commands

```bash
# Quick quality check
npm run check

# Detailed type checking
npx tsc --noEmit --pretty

# ESLint with metrics
npm run lint -- --format stylish

# Format checking
npm run format:check
```

## 🔄 Continuous Improvement

### 1. **Update Standards Based on Team Feedback**

- Regularly review ESLint rules effectiveness
- Adjust TypeScript strictness as project matures
- Update Prettier configuration for team preferences

### 2. **Train Copilot with Examples**

- Create well-documented example functions
- Use consistent patterns across the codebase
- Write clear interface definitions

### 3. **Monitor Copilot Suggestions Quality**

- Review generated code for standards compliance
- Provide feedback through Copilot Chat
- Adjust prompts to get better suggestions

## 🎯 Expected Outcomes

With proper configuration, GitHub Copilot will:

- ✅ Generate TypeScript code with proper type annotations
- ✅ Follow your naming conventions automatically
- ✅ Respect ESLint rules in suggestions
- ✅ Maintain consistent code formatting
- ✅ Understand your project's architectural patterns
- ✅ Suggest code that passes your quality gates

## 🔗 Integration with Development Workflow

### Daily Development

1. Write descriptive comments for intended functionality
2. Let Copilot generate initial implementation
3. Run `npm run check` to validate quality
4. Use `npm run lint:fix` and `npm run format` to clean up
5. Commit code that passes all quality gates

### Code Reviews

1. Automated checks run on every PR
2. Copilot-generated code follows same standards as hand-written code
3. Focus reviews on business logic rather than style issues
4. Standards violations are caught before merge

This approach ensures that GitHub Copilot becomes a productive member of your development team, generating code that meets your quality standards automatically.

---

## Legacy Content: Detailed Coding Standards

_(The rest of the original coding standards document follows...)_

## TypeScript Standards

### Naming Conventions

- **Interfaces**: PascalCase (e.g., `SoulData`, `PerformanceMetrics`)
- **Classes**: PascalCase (e.g., `LODManager`, `AdaptivePerformanceManager`)
- **Functions/Methods**: camelCase (e.g., `createSoul`, `updatePhysics`)
- **Variables**: camelCase or UPPER_CASE for constants (e.g., `soulCount`, `MAX_SOULS`)
- **Types**: PascalCase (e.g., `QualityLevel`, `RenderingMode`)

### Type Definitions

- Always use explicit return types for functions
- Prefer interfaces over type aliases for object shapes
- Use strict TypeScript settings (no implicit any)
- Document complex types with JSDoc comments

```typescript
/**
 * Represents a soul entity in the simulation
 */
interface SoulData {
  id: number;
  type: 'human' | 'gpt' | 'dewa';
  position: THREE.Vector3;
  // ... other properties
}

/**
 * Creates a new soul with the specified parameters
 */
function createSoul(type: SoulData['type'], position: THREE.Vector3): SoulData {
  // Implementation
}
```

### Import Organization

- Group imports: built-in modules, external libraries, internal modules
- Use explicit imports over wildcard imports when possible
- Sort imports alphabetically within groups

```typescript
// Built-in/Node modules
import * as fs from 'fs';

// External libraries
import * as THREE from 'three';
import { onMount } from 'svelte';

// Internal modules
import type { SoulData } from '../types';
import { createSoul } from '../utils/soulManager';
```

## Svelte Standards

### Component Structure

```svelte
<script lang="ts">
  // 1. Imports
  import { onMount } from 'svelte';
  import type { SoulData } from '$lib/types';

  // 2. Props and bindable state
  interface Props {
    souls: SoulData[];
    onUpdate?: (souls: SoulData[]) => void;
  }

  let { souls, onUpdate }: Props = $props();

  // 3. Local state
  let isLoading = $state(false);

  // 4. Derived state
  let soulCount = $derived(souls.length);

  // 5. Functions
  function handleUpdate(): void {
    // Implementation
  }

  // 6. Lifecycle
  onMount(() => {
    // Implementation
  });
</script>

<!-- 7. Markup -->
<div class="component">
  <!-- Content -->
</div>

<!-- 8. Styles -->
<style>
  .component {
    /* Styles */
  }
</style>
```

### Svelte 5 Runes

- Use `$state()` for reactive local variables
- Use `$derived()` for computed values
- Use `$effect()` for side effects
- Use `$props()` for component props with TypeScript interfaces

## Code Style

### Formatting (Prettier)

- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- 100 character line length
- Trailing commas in ES5-compatible contexts

### Functions

- Prefer arrow functions for short utilities
- Use function declarations for main functions
- Always use explicit return types for TypeScript functions

```typescript
// Good: Arrow function with explicit type
const calculateDistance = (a: THREE.Vector3, b: THREE.Vector3): number => {
  return a.distanceTo(b);
};

// Good: Function declaration with explicit type
function createPhysicsEngine(config: PhysicsConfig): PhysicsEngine {
  // Implementation
}
```

### Error Handling

- Use proper error types instead of throwing strings
- Handle async operations with try/catch
- Log errors with context

```typescript
class SimulationError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'SimulationError';
  }
}

async function loadSimulation(): Promise<void> {
  try {
    // Async operation
  } catch (error) {
    console.error('Failed to load simulation:', error);
    throw new SimulationError('Simulation load failed', 'LOAD_ERROR');
  }
}
```

## Performance Guidelines

### Three.js Optimization

- Dispose of geometries and materials properly
- Use instanced rendering for large numbers of similar objects
- Implement LOD (Level of Detail) systems for complex scenes
- Use object pooling for frequently created/destroyed objects

### Memory Management

- Clean up event listeners in component destruction
- Terminate workers when no longer needed
- Use WeakMap/WeakSet for temporary object references

## Documentation

### JSDoc Comments

Use JSDoc for public APIs and complex functions:

```typescript
/**
 * Updates the physics simulation for all souls
 * @param souls - Array of soul objects to update
 * @param deltaTime - Time elapsed since last update in seconds
 * @param options - Optional physics configuration overrides
 * @returns Promise that resolves when physics update is complete
 */
async function updatePhysics(
  souls: SoulData[],
  deltaTime: number,
  options?: Partial<PhysicsConfig>
): Promise<void> {
  // Implementation
}
```

## GitHub Copilot Best Practices

### Context Optimization

1. **File Organization**: Keep related code in the same file or nearby files
2. **Descriptive Names**: Use clear, descriptive variable and function names
3. **Type Annotations**: Provide explicit types to help Copilot understand intent
4. **Comments**: Add contextual comments explaining business logic

### Prompt Engineering

- Write clear, descriptive comments before implementing functionality
- Use consistent naming patterns that Copilot can learn from
- Structure code in predictable patterns

```typescript
// Create a new soul with realistic physics properties and visual characteristics
// The soul should have proper collision detection and lifespan management
function createRealisticSoul(config: SoulCreationConfig): SoulData {
  // Copilot will generate appropriate implementation based on this context
}
```

### Code Consistency

- Follow the established patterns in the codebase
- Use the same architectural approaches (e.g., state management, error handling)
- Maintain consistent file structure across similar modules

## Enforcement

### Pre-commit Hooks

Run these commands before committing:

```bash
npm run check  # Runs type-check, lint, and format:check
```

### CI/CD Integration

All code must pass:

- TypeScript compilation (`npm run type-check`)
- ESLint validation (`npm run lint`)
- Prettier formatting check (`npm run format:check`)

### IDE Integration

- Use VS Code with the recommended extensions
- Enable format-on-save and ESLint auto-fix
- Configure Copilot to respect these standards

## Tools and Extensions

### Required VS Code Extensions

- TypeScript and JavaScript Language Features (built-in)
- Svelte for VS Code
- ESLint
- Prettier - Code formatter
- GitHub Copilot

### Recommended Extensions

- TypeScript Importer
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens

This coding standard ensures that GitHub Copilot generates code that is consistent with our project's architecture and style preferences.
