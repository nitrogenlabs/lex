# Copy Module Test Documentation

This document describes the testing approach for the `copy.ts` module.

## Testing Strategy

The copy module is tested with three separate test files:

1. **CLI Tests** (`copy.cli.test.ts`): Tests the command-line interface functionality.
2. **Integration Tests** (`copy.integration.test.ts`): Tests interactions between components.
3. **Options Tests** (`copy.options.test.ts`): Tests handling of different copy options.

## CLI Tests

The CLI tests focus on:
- Basic file copying functionality
- Directory copying functionality
- Error handling for source path not found
- Error handling for file copy errors
- Error handling for directory copy errors
- Custom CLI name usage
- Quiet mode operation

## Integration Tests

The integration tests validate:
- Integration with fs to check if source exists
- Integration with fs to check if source is a directory
- Integration with app.copyFileSync for file copying
- Integration with app.copyFolderRecursiveSync for directory copying
- Error handling for various scenarios
- Proper order of operations (logging before copying)

## Options Tests

The options tests verify:
- Proper application of the quiet option
- Custom CLI name handling
- Handling of empty options object
- Handling of multiple options being set simultaneously

## Mocking Strategy

The copy module has several external dependencies that are mocked in tests:

- **fs**: Mocked for file system operations like checking existence and file stats
- **app.js**: Mocked for file and directory copying operations
- **log.js**: Mocked to capture log output

## Test Coverage

The tests cover the following key areas:

1. **File System Operations**
   - Checking if source exists
   - Checking if source is a directory
   - Copying files
   - Copying directories recursively

2. **Error Handling**
   - Source path not found
   - File copy errors
   - Directory copy errors

3. **Options Handling**
   - Quiet mode
   - Custom CLI name
   - Default options

4. **Integration Points**
   - Filesystem integration
   - Logging integration
   - Copy utility integration 