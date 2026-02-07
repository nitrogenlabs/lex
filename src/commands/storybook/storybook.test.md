# Storybook Command Test Documentation

This document describes the test coverage for the Storybook command in the Lex framework.

## Test Files

### 1. `storybook.cli.test.ts`

Tests the CLI functionality of the Storybook command.

**Coverage:**

- Default options handling
- Custom CLI name support
- Custom configuration directory
- Auto-open browser functionality
- Custom port configuration
- Static build functionality
- Environment variables handling
- Error handling for invalid JSON
- Storybook installation detection
- Story file detection
- Binary resolution
- Execution error handling
- Quiet mode functionality

**Key Test Cases:**

- `should start Storybook with default options`
- `should use custom CLI name when provided`
- `should use custom config when provided`
- `should enable open option when requested`
- `should use custom port when provided`
- `should build static site when static option is true`
- `should handle environment variables when provided as valid JSON`
- `should handle invalid environment variables JSON`
- `should handle Storybook not installed`
- `should handle no story files found`
- `should handle Storybook binary not found`
- `should handle Storybook execution errors`
- `should respect quiet option`

### 2. `storybook.integration.test.ts`

Tests the integration aspects of the Storybook command.

**Coverage:**

- Story file discovery in multiple locations
- Package.json dependency checking
- Multiple Storybook framework support
- Static build with output directory
- Custom configuration handling
- Port configuration
- Multiple options combination
- Environment variables integration
- File system error handling
- Binary resolution failures
- Execution failures

**Key Test Cases:**

- `should find story files in multiple locations`
- `should check for Storybook installation in package.json`
- `should handle different Storybook framework installations`
- `should handle static build with output directory`
- `should handle custom configuration directory`
- `should handle custom port configuration`
- `should handle multiple options together`
- `should handle environment variables integration`
- `should handle package.json not found`
- `should handle invalid package.json`
- `should handle empty story files array`
- `should handle Storybook binary resolution failure`
- `should handle execa execution failure`

### 3. `storybook.options.test.ts`

Tests the options interface and validation.

**Coverage:**

- Interface definition validation
- Option type validation
- Option combinations
- Valid value ranges
- Partial options handling

**Key Test Cases:**

- `should accept all valid options`
- `should accept partial options`
- `should accept empty options object`
- `should accept string for cliName`
- `should accept string for config`
- `should accept boolean for open`
- `should accept number for port`
- `should accept boolean for quiet`
- `should accept boolean for static`
- `should accept string for variables`
- `should handle development server options`
- `should handle static build options`
- `should handle configuration options`
- `should handle quiet mode with all options`
- `should accept valid port numbers`
- `should accept valid JSON strings for variables`
- `should accept valid config paths`

## Test Patterns

### Mocking Strategy

- **Dependencies**: All external dependencies are mocked using Vitest
- **File System**: `fs` module operations are mocked to avoid actual file system access
- **Process**: `process.env` and `process.cwd` are mocked for consistent testing
- **Binaries**: `resolveBinaryPath` is mocked to return predictable paths
- **Execution**: `execa` is mocked to simulate command execution

### Error Handling Tests

- Invalid JSON in environment variables
- Missing Storybook installation
- No story files found
- Binary not found
- Execution failures
- File system errors

### Success Path Tests

- Default configuration
- Custom options
- Multiple option combinations
- Different Storybook frameworks
- Static and development modes

## Test Data

### Story File Patterns

- `**/*.stories.{ts,tsx,js,jsx}`
- `**/*.story.{ts,tsx,js,jsx}`
- `**/stories/**/*.{ts,tsx,js,jsx}`

### Supported Frameworks

- `@storybook/react`
- `@storybook/vue`
- `@storybook/angular`
- `@storybook/web-components`
- `storybook`

### Valid Port Numbers

- 3000, 6006, 6007, 8080, 9000

### Environment Variables

- JSON strings with various configurations
- Debug flags
- Theme settings
- Port configurations

## Coverage Goals

The test suite aims to achieve:

- **100% function coverage** for the main `storybook` function
- **100% branch coverage** for all conditional logic
- **100% line coverage** for error handling paths
- **Comprehensive integration testing** for file system operations
- **Thorough options validation** for all interface properties

## Running Tests

```bash
# Run all Storybook command tests
npm test -- --testPathPattern=storybook

# Run specific test file
npm test -- storybook.cli.test.ts
npm test -- storybook.integration.test.ts
npm test -- storybook.options.test.ts

# Run with coverage
npm test -- --coverage --testPathPattern=storybook
```
