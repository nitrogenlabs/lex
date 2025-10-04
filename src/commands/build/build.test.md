# Build Command Test Coverage

This document outlines the comprehensive test coverage for the `lex build` command and all its CLI options.

## Test Files

1. **`bulid.test.ts`** - Unit tests for build functions with mocked dependencies
2. **`build.integration.test.ts`** - Integration tests that actually run the lex build command

## CLI Options Coverage

### All CLI Options from lex.ts (33 total)

#### Boolean Flags (15)
✅ **analyze** - Invokes webpack-bundle-analyzer plugin
✅ **disableInterpret** - Disable interpret for loading config file
✅ **failOnWarnings** - Stop webpack-cli process with non-zero exit code on warnings
✅ **merge** - Merge two or more configurations using "webpack-merge"
✅ **noDevtool** - Negative "devtool" option
✅ **noStats** - Negative "stats" option
✅ **noTarget** - Negative "target" option
✅ **noWatch** - Negative "watch" option
✅ **noWatchOptionsStdin** - Negative "watch-options-stdin" option
✅ **quiet** - No Lex notifications printed in the console
✅ **remove** - Removes all files from the output directory before compiling
✅ **static** - Creates static HTML files when building app
✅ **typescript** - Transpile as Typescript
✅ **watch** - Watch for changes
✅ **watchOptionsStdin** - Stop watching when stdin stream has ended

#### Value Options (18)
✅ **bundler** - Bundler to use ("webpack" or "swc"). Default: "swc"
✅ **config** - Custom Webpack configuration file path
✅ **configName** - Name of the configuration to use
✅ **defineProcessEnvNodeEnv** - Sets process.env.NODE_ENV to the specified value
✅ **devtool** - A developer tool to enhance debugging
✅ **entry** - A module that is loaded upon startup
✅ **env** - Environment passed to the configuration when it is a function
✅ **format** - Output format for generated JavaScript files ("cjs" or "esm")
✅ **json** - Prints result as JSON or store it in a file
✅ **lexConfig** - Lex configuration file path (lex.config.js)
✅ **mode** - Webpack mode ("production" or "development")
✅ **name** - Name of the configuration
✅ **nodeEnv** - Sets process.env.NODE_ENV to the specified value
✅ **outputPath** - The output directory as absolute path
✅ **sourcePath** - Source path
✅ **stats** - Stats options object or preset name
✅ **target** - Environment to build for
✅ **variables** - Environment variables to set in "process.env"

## Test Coverage by Function

### buildWithSWC Tests
- ✅ Default configuration
- ✅ Format option (esm, cjs)
- ✅ Watch mode
- ✅ Custom output path
- ✅ TypeScript support
- ✅ React JSX transformation
- ✅ Node environment target
- ✅ Source map generation
- ✅ Error handling

### buildWithWebpack Tests
- ✅ Default configuration
- ✅ All CLI options individually tested
- ✅ Boolean flags combination testing
- ✅ Config file path handling
- ✅ Error handling

### build Function Tests
- ✅ Bundler selection (webpack vs swc)
- ✅ Configuration parsing
- ✅ Linked modules checking
- ✅ File removal when remove=true
- ✅ TypeScript configuration checking
- ✅ Environment variables setting
- ✅ Invalid JSON handling in variables
- ✅ Spinner creation with quiet option
- ✅ All build options support

### Integration Tests
- ✅ Actual lex build command execution
- ✅ Webpack bundler integration
- ✅ SWC bundler integration
- ✅ Multiple CLI options combination
- ✅ CLI option validation
- ✅ Bundler choice validation
- ✅ Format choice validation
- ✅ Mode choice validation

## Key Testing Features

### Mocking Strategy
- ✅ `execa` for command execution
- ✅ File system operations
- ✅ Glob file searching
- ✅ External dependencies (GraphQL loader)
- ✅ Utility functions (spinner, logging)

### Error Scenarios
- ✅ Build failures (both webpack and swc)
- ✅ Invalid JSON in variables option
- ✅ Missing dependencies

### Real-world Scenarios
- ✅ TypeScript project builds
- ✅ GraphQL-enabled projects
- ✅ External dependency handling
- ✅ Different target environments (node vs web)
- ✅ Custom configuration files
- ✅ Watch mode operation

## Test Running

```bash
# Run unit tests
npm test src/commands/bulid.test.ts

# Run integration tests
npm test src/commands/build/build.integration.test.ts

# Run all build-related tests
npm test -- --testNamePattern="build"
```

## Regression Testing

These tests ensure that when NPM packages are updated:

1. **CLI Options Compatibility** - All 33 CLI options continue to work
2. **Bundler Integration** - Both webpack and swc integration remains functional
3. **Configuration Parsing** - Lex config file processing works correctly
4. **Error Handling** - Proper error messages and exit codes are maintained
5. **Environment Variables** - Variable injection continues to work
6. **File Operations** - File removal, output directory creation, etc.

## Future Enhancements

- Add performance benchmarking tests
- Add tests for specific webpack/swc version compatibility
- Add tests for edge cases in file path handling
- Add tests for different operating system environments