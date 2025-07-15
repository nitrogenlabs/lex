# Create Module Test Documentation

This document describes the testing approach for the `create.ts` module.

## Testing Strategy

The create module is tested with three separate test files:

1. **CLI Tests** (`create.cli.test.ts`): Tests the command-line interface functionality.
2. **Integration Tests** (`create.integration.test.ts`): Tests interactions between components.
3. **Options Tests** (`create.options.test.ts`): Tests handling of different create options.

## CLI Tests

The CLI tests focus on:
- Creating changelogs
- Creating stores
- Creating tsconfig files
- Creating views
- Creating VSCode configuration
- Error handling for stores and views
- Custom CLI name usage
- Quiet mode operation

## Integration Tests

The integration tests validate:
- Integration with LexConfig to parse configuration
- TypeScript configuration checking
- Integration with createChangelog for changelog creation
- Integration with getFilenames for store and view creation
- Integration with copyFolderRecursiveSync for file copying
- Integration with removeFiles for file removal
- Integration with fs.readFileSync and fs.writeFileSync for file operations
- Integration with fs.renameSync for file renaming
- Integration with updateTemplateName for template processing
- Proper order of operations (logging before other operations)

## Options Tests

The options tests verify:
- Proper application of the cliName option
- Proper application of the quiet option
- Proper application of the outputFile option
- Proper application of the outputName option
- Handling of empty options object
- Handling of multiple options being set simultaneously

## Mocking Strategy

The create module has several external dependencies that are mocked in tests:

- **fs**: Mocked for file system operations like checking existence, reading, writing, and renaming files
- **path**: Mocked for path resolution
- **URL**: Mocked for getting the current directory path
- **changelog.js**: Mocked for changelog creation functionality
- **LexConfig.js**: Mocked for configuration parsing and TypeScript configuration checking
- **app.js**: Mocked for file and directory operations
- **log.js**: Mocked to capture log output

## Test Coverage

The tests cover the following key areas:

1. **Asset Creation**
   - Changelog creation
   - Store creation
   - TSConfig creation
   - View creation
   - VSCode configuration creation

2. **Error Handling**
   - Directory already exists
   - File system errors
   - Missing required options

3. **Options Handling**
   - Custom CLI name
   - Output file name
   - Output asset name
   - Quiet mode
   - Default options

4. **Integration Points**
   - Configuration parsing
   - TypeScript configuration checking
   - File system operations
   - Template processing
   - Logging 