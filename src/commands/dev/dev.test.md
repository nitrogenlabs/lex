# Dev Module Test Documentation

This document describes the testing approach for the `dev.ts` module.

## Testing Strategy

The dev module is tested with three separate test files:

1. **CLI Tests** (`dev.cli.test.ts`): Tests the command-line interface functionality.
2. **Integration Tests** (`dev.integration.test.ts`): Tests interactions between components.
3. **Options Tests** (`dev.options.test.ts`): Tests handling of different dev options.

## CLI Tests

The CLI tests focus on:
- Starting the development server with default options
- Custom CLI name usage
- Custom webpack configuration usage
- Bundle analyzer option
- Open browser option
- Output directory cleaning
- Environment variables handling
- Error handling for webpack compilation
- Quiet mode operation

## Integration Tests

The integration tests validate:
- Integration with LexConfig to parse configuration
- TypeScript configuration checking
- Integration with app.removeFiles for output directory cleaning
- Integration with file.relativeNodePath to find webpack-cli
- Integration with execa to run webpack
- Integration with app.createSpinner for spinner UI
- Integration with log for output messages
- Environment variables setting
- Proper order of operations
- Error handling and callback invocation

## Options Tests

The options tests verify:
- Proper application of the bundleAnalyzer option
- Proper application of the cliName option
- Proper application of the config option
- Proper application of the open option
- Proper application of the quiet option
- Proper application of the remove option
- Proper application of the variables option
- Handling of empty options object
- Error handling for invalid variables JSON

## Mocking Strategy

The dev module has several external dependencies that are mocked in tests:

- **execa**: Mocked for running webpack
- **path**: Mocked for path resolution
- **URL**: Mocked for getting the current directory path
- **LexConfig**: Mocked for configuration parsing and TypeScript configuration checking
- **app.js**: Mocked for spinner UI and file operations
- **file.js**: Mocked for finding node modules
- **log.js**: Mocked to capture log output

## Test Coverage

The tests cover the following key areas:

1. **Development Server Setup**
   - Starting webpack development server
   - Webpack configuration handling
   - Bundle analyzer integration
   - Browser auto-opening

2. **Environment Setup**
   - TypeScript configuration checking
   - Environment variables setting
   - Output directory cleaning

3. **Options Handling**
   - All available options
   - Default values
   - Invalid inputs

4. **Error Handling**
   - Webpack compilation errors
   - Invalid environment variables JSON
   - Proper error reporting

5. **Integration Points**
   - Configuration parsing
   - TypeScript configuration checking
   - File system operations
   - Webpack execution
   - Spinner UI
   - Logging 