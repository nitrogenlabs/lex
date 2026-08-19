# LEX Testing Module

The test module provides a comprehensive interface for running Vitest unit tests and Playwright E2E tests, with AI-powered assistance for the Vitest side.

## Overview

The test module offers functionality to:

- Run Vitest unit tests with various configuration options
- Run Playwright E2E tests through the same `lex test` entrypoint
- Generate test files using AI for uncovered source files
- Analyze test coverage and suggest improvements using AI
- Debug failing tests with AI assistance
- Support `*.test.ts[x]` for unit tests and `*.e2e.ts[x]` for E2E tests

## API

### test(options, args, callback)

Main function that handles running tests.

#### Parameters

- `options` (TestOptions): Command options object
  - See below for all supported options
- `args` (string[]): Additional arguments to pass to Vitest
- `callback` (Function): Callback function called when tests complete
  - Default: `process.exit`
  - Called with `0` for success or `1` for failure

#### Returns

- (Promise<number>): Returns 0 for success, 1 for failure

### getTestFilePatterns(testPathPattern)

Utility function to get test file patterns based on the provided testPathPattern.

#### Parameters

- `testPathPattern` (string): Optional test path pattern

#### Returns

- (string[]): Array of test file patterns

## TestOptions Interface

```typescript
export interface TestOptions {
  readonly analyze?: boolean;        // Enable AI test coverage analysis
  readonly aiDebug?: boolean;        // Enable AI debugging assistance (alias)
  readonly aiGenerate?: boolean;     // Enable AI test generation (alias)
  readonly aiAnalyze?: boolean;      // Enable AI test analysis (alias)
  readonly bail?: boolean;           // Stop on first failure
  readonly changedFilesWithAncestor?: boolean; // Run tests related to files changed since common ancestor
  readonly changedSince?: string;    // Run tests related to files changed since the specified branch
  readonly ci?: boolean;             // Run in CI mode
  readonly clearCache?: boolean;     // Clear Vitest cache
  readonly cliName?: string;         // Name of the CLI tool (default: 'Lex')
  readonly collectCoverageFrom?: string; // Coverage pattern
  readonly colors?: boolean;         // Force colors in output
  readonly config?: string;          // Path to Vitest config
  readonly debug?: boolean;          // Enable debugging info
  readonly debugTests?: boolean;     // Enable AI debugging assistance
  readonly detectOpenHandles?: boolean; // Detect open handles
  readonly e2e?: boolean;            // Run Playwright E2E tests
  readonly e2eConfig?: string;       // Path to Playwright config
  readonly environment?: string;     // Runner environment
  readonly env?: string;             // Test environment
  readonly errorOnDeprecated?: boolean; // Error on deprecated API usage
  readonly expand?: boolean;         // Expand results
  readonly forceExit?: boolean;      // Force Vitest to exit after tests
  readonly generate?: boolean;       // Enable AI test generation
  readonly json?: boolean;           // Output results in JSON
  readonly lastCommit?: boolean;     // Run tests on files from the last commit
  readonly listTests?: boolean;      // List tests without running them
  readonly logHeapUsage?: boolean;   // Log heap usage
  readonly maxWorkers?: string;      // Max number of workers
  readonly noStackTrace?: boolean;   // Hide stack trace
  readonly notify?: boolean;         // Show notifications
  readonly onlyChanged?: boolean;    // Only run tests related to changed files
  readonly outputFile?: string;      // Write test results to a file
  readonly passWithNoTests?: boolean; // Pass when no tests are found
  readonly quiet?: boolean;          // Reduce output
  readonly removeCache?: boolean;    // Clear Vitest cache
  readonly runInBand?: boolean;      // Run all tests serially in current process
  readonly setup?: string;           // Path to setup file
  readonly showConfig?: boolean;     // Show config info
  readonly silent?: boolean;         // Prevent tests from printing messages
  readonly testLocationInResults?: boolean; // Add location info to results
  readonly testNamePattern?: string; // Run only tests with names matching the pattern
  readonly testPathPattern?: string; // Run only tests at paths matching the pattern
  readonly unit?: boolean;           // Run Vitest unit tests
  readonly update?: boolean;         // Update snapshots
  readonly useStderr?: boolean;      // Write to stderr instead of stdout
  readonly verbose?: boolean;        // Display individual test results
  readonly watch?: string;           // Watch for file changes and rerun tests
  readonly watchAll?: boolean;       // Watch for file changes and rerun all tests
}
```

## Example Usage

```javascript
// Import the test function
import {test} from '@nlabs/lex';

// Run tests with default options
await test({}, []);

// Run tests with specific options
await test({
  quiet: false,
  bail: true,
  ci: true,
  colors: true,
  detectOpenHandles: true
}, []);

// Run tests with AI features
await test({
  generate: true,   // Generate tests for uncovered files using AI
  analyze: true,    // Analyze test coverage with AI
  debugTests: true  // Get AI debugging help for failing tests
}, []);

// Run with a specific test file pattern
await test({
  testPathPattern: 'src/components/**/*.test.tsx'
}, []);

// Run with a specific Vitest configuration file
await test({
  config: './custom-vitest.config.js'
}, []);

// Run E2E tests only
await test({
  e2e: true
}, []);

// Run both unit and E2E tests
await test({
  unit: true,
  e2e: true
}, []);

// With custom callback
await test({
  verbose: true
}, [], (exitCode) => {
  console.log(`Tests completed with exit code ${exitCode}`);
  process.exit(exitCode);
});
```

## AI Features

### Test Generation

When `generate` or `aiGenerate` is true, the module will:
1. Analyze your project to find source files without corresponding test files
2. Use AI to generate test code for one of those files
3. Output detailed test suggestions

### Test Analysis

When `analyze` or `aiAnalyze` is true, the module will:
1. Collect test results in JSON format
2. Pass the results to an AI for analysis
3. Provide suggestions for improving test coverage

### Test Debugging

When `debugTests` or `aiDebug` is true, the module will (when tests fail):
1. Collect test failure information
2. Pass the error details to an AI for debugging assistance
3. Offer potential solutions for fixing the failing tests

## Basic Usage

```bash
lex test [options]
```

By default, `lex test` continues to run unit tests. Use `--e2e` to run Playwright tests, and combine `--unit --e2e` to run both.

## AI-Assisted Features

The test command includes AI capabilities to help with testing:

```bash
# Get AI assistance for generating tests
lex test --generate

# Get AI analysis of test coverage and suggestions
lex test --analyze 

# Get AI help for debugging test failures
lex test --debugTests

# Use all AI features together
lex test --generate --analyze --debugTests
```

## Common Options

```bash
# Run tests with coverage reporting
lex test --unit --collectCoverageFrom "src/**/*.{ts,tsx}"

# Watch for changes and rerun tests
lex test --unit --watch src

# Run only changed files
lex test --unit --onlyChanged

# Update snapshots
lex test --unit --update

# Run tests in CI mode
lex test --unit --ci

# Run Playwright E2E tests
lex test --e2e

# Run both unit and E2E suites
lex test --unit --e2e
```

## Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--generate` | boolean | `false` | Use AI to generate test cases for untested code. |
| `--analyze` | boolean | `false` | Use AI to analyze test coverage and suggest improvements. |
| `--debugTests` | boolean | `false` | Use AI to debug test failures and suggest fixes. |
| `--bail` | boolean | `false` | Stop running tests after the first failure. |
| `--changedFilesWithAncestor` | boolean | `false` | Run tests related to changed files based on git (includes ancestors). |
| `--changedSince` | string | - | Run tests related to files changed since the provided branch/commit. |
| `--ci` | boolean | `false` | Run tests in continuous integration mode. |
| `--collectCoverageFrom` | string | - | Files for which coverage information should be collected. |
| `--colors` | boolean | `false` | Force test output to be colored. |
| `--config` | string | - | Custom Vitest configuration file path. |
| `--debug` | boolean | `false` | Run tests in debug mode. |
| `--detectOpenHandles` | boolean | `false` | Detect handles that weren't closed properly. |
| `--e2e` | boolean | `false` | Run Playwright tests matching `*.e2e.ts[x]`. |
| `--e2eConfig` | string | - | Custom Playwright configuration file path. |
| `--environment` | string | - | Set Lex's target environment while resolving configuration. |
| `--env` | string | - | Test environment used by Vitest. |
| `--errorOnDeprecated` | boolean | `false` | Accepted for compatibility; Vitest does not support it and Lex logs a warning. |
| `--expand` | boolean | `false` | Use the expanded display format for test results. |
| `--forceExit` | boolean | `false` | Accepted for compatibility; Vitest does not support it and Lex logs a warning. |
| `--json` | boolean | `false` | Output results as JSON. |
| `--lastCommit` | boolean | `false` | Run tests related to files changed in the last commit. |
| `--lexConfig` | string | - | Custom Lex configuration file path. |
| `--listTests` | boolean | `false` | List all tests without running them. |
| `--logHeapUsage` | boolean | `false` | Log heap usage after each test. |
| `--maxWorkers` | string | - | Maximum number of workers used running tests. |
| `--noStackTrace` | boolean | `false` | Accepted for compatibility; Vitest does not support it and Lex logs a warning. |
| `--notify` | boolean | `false` | Accepted for compatibility; Vitest does not support it and Lex logs a warning. |
| `--onlyChanged` | boolean | `false` | Run tests related to changed files. |
| `--outputFile` | string | - | Write test results to a file. |
| `--passWithNoTests` | boolean | `false` | Pass when no tests are found. |
| `--quiet` | boolean | `false` | No Lex notifications printed in the console. |
| `--clearCache` | boolean | `false` | Clear the Vitest cache before running. |
| `--runInBand` | boolean | `false` | Run all tests serially in the current process. |
| `--setup` | string | - | Path to Vitest setup file. |
| `--showConfig` | boolean | `false` | Show Vitest configuration and exit. |
| `--silent` | boolean | `false` | Prevent tests from printing messages through console. |
| `--testLocationInResults` | boolean | `false` | Add location info to test results. |
| `--testNamePattern` | string | - | Run only tests with a name that matches the regex pattern. |
| `--testPathPattern` | string | - | Run only tests with a file path that matches the regex pattern. |
| `--typescript` | boolean | `false` | Enable TypeScript-aware Lex configuration for the test run. |
| `--unit` | boolean | `false` | Run Vitest unit tests matching `*.test.ts[x]`. |
| `--update` | boolean | `false` | Update snapshots. |
| `--useStderr` | boolean | `false` | Accepted for compatibility; Vitest does not support it and Lex logs a warning. |
| `--verbose` | boolean | `false` | Display individual test results with the test suite hierarchy. |
| `--watch` | string | - | Watch files for changes and rerun tests related to changed files. |
| `--watchAll` | boolean | `false` | Watch files for changes and rerun all tests. |

## Advanced Usage

### Generate Tests Automatically

Use AI to generate test cases for existing code:

```bash
lex test --unit --generate --testPathPattern="src/components/*.js"
```

### Debug Test Failures

When tests fail, use AI to get debugging suggestions:

```bash
lex test --unit --debugTests
```

### Analyze Coverage

Get AI-powered suggestions to improve test coverage:

```bash
lex test --unit --analyze --collectCoverageFrom "src/**/*.{ts,tsx}"
```

### Integration with CI/CD

For continuous integration environments:

```bash
lex test --unit --ci --errorOnDeprecated --passWithNoTests
```

### E2E Tests

For running E2E tests:

```bash
lex test --e2e

# Run a specific E2E file
lex test --e2e src/commands/test/test.e2e.ts

# Run both suites together
lex test --unit --e2e
```
