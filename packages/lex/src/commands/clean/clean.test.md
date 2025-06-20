# Clean Module Test Documentation

This document describes the testing approach for the `clean.ts` module.

## Testing Strategy

The clean module is tested with three separate test files:

1. **CLI Tests** (`clean.cli.test.ts`): Tests the command-line interface functionality.
2. **Integration Tests** (`clean.integration.test.ts`): Tests interactions between components.
3. **Options Tests** (`clean.options.test.ts`): Tests handling of different clean options.

## CLI Tests

The CLI tests focus on:
- Basic command execution with default options
- Error handling for cleaning failures
- Handling of the snapshots option
- Custom CLI name usage
- Quiet mode operation

## Integration Tests

The integration tests validate:
- Complete cleaning process with all file types
- Error handling at different stages of the cleaning process
- Proper order of operations
- Configuration parsing before cleaning operations

## Options Tests

The options tests verify:
- Proper application of the quiet option
- Proper application of the snapshots option
- Custom CLI name handling
- Passing options to LexConfig

## Mocking Strategy

The clean module has several external dependencies that are mocked in tests:

- **app.js**: Mocked for spinner functionality and file removal operations
- **log.js**: Mocked to capture log output
- **LexConfig.js**: Mocked for configuration parsing

## Test Coverage

The tests cover the following key areas:

1. **File Removal Operations**
   - Node modules removal
   - Coverage reports removal
   - NPM logs removal
   - Snapshots removal (when enabled)

2. **Configuration Handling**
   - Parsing LexConfig before cleaning
   - Applying configuration options

3. **Error Handling**
   - Handling failures in removeModules
   - Handling failures in removeFiles
   - Proper error reporting

4. **Command Line Options**
   - Processing and applying quiet option
   - Processing and applying snapshots option
   - Custom CLI name handling 