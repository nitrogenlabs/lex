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

- **ai** - *(optional)* AI configuration options.
  - **provider** - *(optional)* AI provider to use. Options: 'cursor', 'copilot', 'openai', 'anthropic', 'none'. Default: 'none'.
  - **apiKey** - *(optional)* API key for the AI provider.
  - **model** - *(optional)* Model to use for the AI provider.
  - **maxTokens** - *(optional)* Maximum tokens for AI completions.
  - **temperature** - *(optional)* Temperature for AI generation.
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

## AI-Enhanced Features

Lex now integrates AI capabilities across multiple commands to improve development efficiency and code quality:

### AI-Powered Linting

The lint command now supports AI-powered fixes for issues that standard ESLint can't automatically resolve:

```bash
# Run linting with AI-powered fixes
lex lint --aifix
```

### AI-Enhanced Test Command

We've integrated AI capabilities into the Lex test command to improve testing efficiency and quality:

#### Test Features

- **Test Generation** (`--generate`): Automatically identifies source files without corresponding test files and generates comprehensive test cases with proper fixtures and mocks.

- **Test Analysis** (`--analyze`): Analyzes test coverage and results to provide suggestions for improving test coverage, recommended test cases, and best practices.

- **Test Debugging** (`--debugTests`): When tests fail, provides intelligent debugging assistance with root cause analysis and suggested fixes.

#### Test Usage Examples

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

### AI Provider Configuration

Lex supports multiple AI providers:

1. **Cursor IDE** - Integration with Cursor's AI capabilities
2. **GitHub Copilot** - Integration with GitHub's Copilot AI

You can configure your preferred AI provider in your `lex.config.js` file:

```javascript
export default {
  // Other configuration...
  ai: {
    provider: 'cursor', // 'cursor', 'copilot', or 'none'
    apiKey: 'your-api-key', // Optional if using environment variables
    model: 'cursor-code'
  }
}
```

If no AI provider is configured when you run an AI-powered command, Lex will prompt you to choose a provider.

For detailed documentation on AI features, see `packages/lex/docs/ai-configuration.md`.
