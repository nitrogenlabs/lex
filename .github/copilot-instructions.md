# Lex: AI Coding Agent Instructions

## Project Overview
Lex is a zero-configuration React development CLI that provides a complete development environment with AI-powered features. It uses SWC for lightning-fast compilation and includes Jest testing, Storybook integration, and intelligent code assistance.

## Architecture & Key Components

### Core Structure
- **Source**: `src/` - TypeScript source code
- **Compiled**: `lib/` - SWC-compiled JavaScript output
- **Commands**: `src/commands/` - Individual command modules (build, dev, test, ai, etc.)
- **Utils**: `src/utils/` - Shared utilities (file operations, logging, AI services)
- **Config**: `LexConfig.ts` - Configuration management and defaults

### Build System
- **Compiler**: SWC (10-100x faster than Babel)
- **Bundler**: Webpack (configurable, defaults to SWC for speed)
- **Testing**: Jest with jsdom environment
- **Linting**: ESLint with AI-powered auto-fixes

## Critical Workflows

### Development Server
```bash
lex dev --open  # Start hot-reloading dev server
lex dev --bundleAnalyzer  # Analyze bundle size
```

### Building & Compilation
```bash
lex build --mode production  # Production build
lex compile --watch  # Watch mode compilation
```

### Testing
```bash
lex test --watch  # Run tests in watch mode
lex test --generate  # AI-generated test cases
lex test --analyze  # AI test coverage analysis
```

### AI Features
```bash
lex ai --task generate --prompt "Create a React component"
lex ai --task explain --file src/components/Button.tsx
lex lint --fix  # AI-powered ESLint fixes
```

## Configuration Patterns

### lex.config.js Structure
```javascript
export default {
  ai: {
    provider: 'openai', // 'openai' | 'anthropic' | 'cursor' | 'none'
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o',
    maxTokens: 4000
  },
  useTypescript: true,
  preset: 'web', // 'web' | 'node' | 'lambda'
  sourcePath: './src',
  outputPath: './lib'
}
```

### Command Implementation Pattern
```typescript
// src/commands/example/example.ts
import {Command} from 'commander';
import {LexConfig} from '../../LexConfig.js';

export const example = new Command('example')
  .option('--option <value>', 'Description')
  .action(async (options) => {
    const config = LexConfig.config || {};
    // Implementation
  });
```

## Code Conventions

### File Organization
- Commands: One file per command in `src/commands/[name]/`
- Utils: Shared functions in `src/utils/`
- Types: Centralized in `src/types.ts`
- Config: All configuration logic in `LexConfig.ts`

### Error Handling
```typescript
try {
  // Operation
} catch (error) {
  log(`${chalk.red('Error:')} ${error.message}`, 'error');
  return {error: error.message};
}
```

### Logging
```typescript
import {log} from '../utils/log.js';
log('Success message', 'success');
log('Info message', 'info');
log('Warning message', 'warning');
log('Error message', 'error');
```

### AI Integration
- Use `callAIService()` from `utils/aiService.ts`
- Support multiple providers (OpenAI, Anthropic, Cursor)
- Include project context when relevant
- Handle provider-specific authentication

## Testing Patterns

### Unit Tests
```typescript
// Use Jest with jsdom for DOM testing
import {render, screen} from '@testing-library/react';
import {Button} from './Button.js';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### CLI Command Testing
```typescript
// Mock commander and test command actions
import {example} from './example.js';

describe('example command', () => {
  it('handles options correctly', async () => {
    // Test implementation
  });
});
```

## Key Files to Reference

- [`src/lex.ts`](src/lex.ts) - Main CLI entry point and command registration
- [`src/LexConfig.ts`](src/LexConfig.ts) - Configuration management
- [`src/commands/ai/ai.ts`](src/commands/ai/ai.ts) - AI command implementation
- [`src/utils/aiService.ts`](src/utils/aiService.ts) - AI service integrations
- [`package.json`](package.json) - Dependencies and scripts
- [`README.md`](README.md) - User documentation

## Common Patterns

### Async Command Handlers
```typescript
.action(async (options) => {
  try {
    await someAsyncOperation(options);
    process.exit(0);
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    process.exit(1);
  }
})
```

### Configuration Merging
```typescript
import {deepMerge} from '../utils/deepMerge.js';
const finalConfig = deepMerge(defaultConfig, userConfig);
```

### File Operations
```typescript
import {readFile, writeFile} from '../utils/file.js';
// Use utility functions instead of fs directly
```

## AI-Specific Guidelines

- Always check for AI provider configuration before making API calls
- Include relevant file/directory context in prompts
- Handle rate limits and API errors gracefully
- Support both streaming and non-streaming responses
- Use temperature 0.1 for code generation tasks

## Development Tips

- Use `npm run build` to compile TypeScript to JavaScript
- Use `npm run lint` to check code quality
- Use `npm run test` for unit tests
- Commands should be stateless and configurable
- Prefer functional programming patterns
- Document complex logic with comments
- Follow existing naming conventions (camelCase for variables, PascalCase for types)