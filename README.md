# @nlabs/lex

Lex is a console line execution module. Works out of the box for any React project, taking care of all your development needs. No need to install unit testing, transpilers, compilers, or even development servers. Install Lex globally and let go of all the grunt work, allowing you focus on coding your app.

Lex eliminates this hassle. With the most common enterprise configurations used, developers can simply run and go. Lex uses the following libraries to assist in development.

- [ESBuild](https://esbuild.github.io/)
- [Jest](https://facebook.github.io/jest/)
- [Typescript](http://www.typescriptlang.org/)
- [Webpack](https://webpack.js.org/)

## Documentation

See Lex [documentation site](http://lex.nitrogenlabs.com) for full details.

## Installation

Lex is installed globally using npm.

```shell
npm install -g @nlabs/lex
```

lex compile -c ./webpack.config.js

## Quick Start

```shell
// Install a skeleton app with the ArkhamJS framework
$ npm install -g @nlabs/lex
$ lex init myApp -i
$ cd myApp

// Run the dev server
$ lex dev -o
```

## Configuration

- **configFiles** - *(optional)* - Array of configuration files to load. Defaults to `['package.json', 'lex.config.js']`.
- **entryHTML** - *(optional)* Path to the HTML file to use as the entry point for the app.
- **entryJs** - *(optional)* Path to the JS file to use as the entry point for the app.
- **esbuild** - *(optional)* Options to pass to esbuild.
- **env** - *(optional)* Environment variables to pass to the app.
- **gitUrl** - *(optional)* The URL to the git repository.
- **jest** - *(optional)* Options to pass to Jest.
- **libraryName** - *(optional)* The name of the library.
- **libraryTarget** - *(optional)* The target for the library.
- **outputFile** - *(optional)* Path to the output file.
- **outputFullPath** - *(optional)* The full path to the output file.
- **outputHash** - *(optional)* Whether to add a hash to the output file.
- **outputPath** - *(optional)* Path to the output directory.
- **packageManager** - *(optional)* Manager to use for node modules Options: 'npm', 'yarn'. Default: 'npm'.
- **preset** - *(optional)* Preset to use for the project Options: `web`, `node`, `lambda`, `mobile`. Default: `web`.
- **sourceFullPath** - *(optional)* Path to the source files.
- **sourcePath** - *(optional)* Path to the source files.
- **targetEnvironment** - *(optional)* 'node' | 'web';
- **useGraphQl** - *(optional)* Whether to use GraphQL.
- **useTypescript** - *(optional)* Use Typescript for the project. Default: false.
- **webpack** - *(optional)* Options to pass to Webpack.

## AI-Enhanced Test Command

We've integrated AI capabilities into the Lex test command to improve testing efficiency and quality:

### Features

- **Test Generation** (`--generate`): Automatically identifies source files without corresponding test files and generates comprehensive test cases with proper fixtures and mocks.

- **Test Analysis** (`--analyze`): Analyzes test coverage and results to provide suggestions for improving test coverage, recommended test cases, and best practices.

- **Test Debugging** (`--debugTests`): When tests fail, provides intelligent debugging assistance with root cause analysis and suggested fixes.

### Usage Examples

```bash
# Generate tests for untested files
lex test --generate

# Analyze test coverage and get improvement suggestions
lex test --collectCoverage --analyze

# Debug failing tests with AI assistance
lex test --debugTests

# Full AI-powered testing workflow
lex test --generate --analyze --debugTests
```

> **Note:** For backward compatibility, the previous option names (`--generate`, `--analyze`, `--debugTests`) are still supported but considered deprecated.

### Implementation

The AI features leverage the existing AI module to:

1. Find untested source files and generate appropriate test cases
2. Process Jest output to provide analysis and optimization suggestions
3. Debug test failures with contextual recommendations

For detailed documentation, see `packages/lex/src/commands/test/test.docs.md`.
