# Config Module Test Documentation

This document describes the testing approach for the `config.ts` module.

## Testing Strategy

The config module is tested with three separate test files:

1. **CLI Tests** (`config.cli.test.ts`): Tests the command-line interface functionality.
2. **Integration Tests** (`config.integration.test.ts`): Tests interactions between components.
3. **Options Tests** (`config.options.test.ts`): Tests handling of different config options.

## CLI Tests

The CLI tests focus on:
- Basic command execution with different configuration types (app, jest, webpack)
- Error handling for invalid configuration types
- Custom CLI name usage
- JSON output file creation

## Integration Tests

The integration tests validate:
- Integration with LexConfig for app configuration
- Integration with Jest configuration module
- Integration with Webpack configuration module
- Integration with filesystem for JSON output
- Error handling for invalid configuration types
- Proper formatting of configuration types with startCase

## Options Tests

The options tests verify:
- Proper application of the quiet option
- JSON file output option handling
- Custom CLI name handling
- Passing options to LexConfig

## Mocking Strategy

The config module has several external dependencies that are mocked in tests:

- **fs**: Mocked for file operations
- **path**: Mocked for path operations
- **lodash/startCase.js**: Mocked for text formatting
- **app.js**: Mocked for spinner functionality
- **log.js**: Mocked to capture log output
- **LexConfig.js**: Mocked for configuration parsing
- **Dynamic imports**: Mocked for Jest and Webpack configurations

## Test Coverage

The tests cover the following key areas:

1. **Configuration Type Handling**
   - Validation of configuration types
   - Processing of different configuration types (app, jest, webpack)
   - Error handling for invalid types

2. **Configuration Output**
   - JSON output file creation
   - Formatting of output

3. **Options Handling**
   - Custom CLI name usage
   - Quiet mode operation
   - JSON file path handling

4. **Integration Points**
   - LexConfig integration
   - Jest configuration integration
   - Webpack configuration integration
   - Filesystem integration 