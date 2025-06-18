# Lex Test Command

## Overview

The `test` command runs your project's tests using Jest with enhanced features and AI capabilities to improve testing efficiency and quality.

## Basic Usage

```bash
lex test [options]
```

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

> **Note:** For backward compatibility, the previous option names (`--generate`, `--analyze`, `--debugTests`) are still supported but considered deprecated.

## Common Options

```bash
# Run tests with coverage reporting
lex test --collectCoverage

# Watch for changes and rerun tests
lex test --watch

# Run only changed files
lex test --onlyChanged

# Update snapshots
lex test --update

# Run tests in CI mode
lex test --ci
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
| `--config` | string | - | Custom Jest configuration file path. |
| `--debug` | boolean | `false` | Run tests in debug mode. |
| `--detectOpenHandles` | boolean | `false` | Detect handles that weren't closed properly. |
| `--env` | string | - | Test environment used by Jest. |
| `--errorOnDeprecated` | boolean | `false` | Make calling deprecated APIs throw helpful error messages. |
| `--expand` | boolean | `false` | Use the expanded display format for test results. |
| `--forceExit` | boolean | `false` | Force Jest to exit after all tests complete. |
| `--json` | boolean | `false` | Output results as JSON. |
| `--lastCommit` | boolean | `false` | Run tests related to files changed in the last commit. |
| `--listTests` | boolean | `false` | List all tests without running them. |
| `--logHeapUsage` | boolean | `false` | Log heap usage after each test. |
| `--maxWorkers` | string | - | Maximum number of workers used running tests. |
| `--noStackTrace` | boolean | `false` | Disables stack trace in test results. |
| `--notify` | boolean | `false` | Activates OS notifications for test results. |
| `--onlyChanged` | boolean | `false` | Run tests related to changed files. |
| `--outputFile` | string | - | Write test results to a file. |
| `--passWithNoTests` | boolean | `false` | Pass when no tests are found. |
| `--quiet` | boolean | `false` | No Lex notifications printed in the console. |
| `--removeCache` | boolean | `false` | Clear test cache before running. |
| `--runInBand` | boolean | `false` | Run all tests serially in the current process. |
| `--setup` | string | - | Path to Jest setup file. |
| `--showConfig` | boolean | `false` | Show Jest configuration and exit. |
| `--silent` | boolean | `false` | Prevent tests from printing messages through console. |
| `--testLocationInResults` | boolean | `false` | Add location info to test results. |
| `--testNamePattern` | string | - | Run only tests with a name that matches the regex pattern. |
| `--testPathPattern` | string | - | Run only tests with a file path that matches the regex pattern. |
| `--update` | boolean | `false` | Update snapshots. |
| `--useStderr` | boolean | `false` | Divert all output to stderr. |
| `--verbose` | boolean | `false` | Display individual test results with the test suite hierarchy. |
| `--watch` | string | - | Watch files for changes and rerun tests related to changed files. |
| `--watchAll` | boolean | `false` | Watch files for changes and rerun all tests. |

## Advanced Usage

### Generate Tests Automatically

Use AI to generate test cases for existing code:

```bash
lex test --generate --testPathPattern="src/components/*.js"
```

### Debug Test Failures

When tests fail, use AI to get debugging suggestions:

```bash
lex test --debugTests
```

### Analyze Coverage

Get AI-powered suggestions to improve test coverage:

```bash
lex test --analyze --collectCoverage
```

### Integration with CI/CD

For continuous integration environments:

```bash
lex test --ci --errorOnDeprecated --passWithNoTests
```

### E2E Tests

For running E2E tests:

```bash
lex test --testPathPattern="e2e/*.test.js" --runInBand
``` 