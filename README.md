# @nlabs/lex

Lex is a console line execution module. Works out of the box for any React project, taking care of all your development needs. No need to install unit testing, transpilers, compilers, or even development servers. Install Lex globally and let go of all the grunt work, allowing you focus on coding your app.

Lex eliminates this hassle. With the most common enterprise configurations used, developers can simply run and go. Lex uses the following libraries to assist in development.

- [ESBuild](https://esbuild.github.io/)
- [Jest](https://facebook.github.io/jest/)
- [Typescript](http://www.typescriptlang.org/)
- [Webpack](https://webpack.js.org/)

## Table of Contents

- [Documentation](#documentation)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
  - [init](#init)
  - [ai](#ai)
  - [dev](#dev)
  - [build](#build)
  - [test](#test)
  - [lint](#lint)
  - [clean](#clean)
  - [compile](#compile)
  - [config](#config)
  - [copy](#copy)
  - [create](#create)
  - [link](#link)
  - [migrate](#migrate)
  - [publish](#publish)
  - [update](#update)
  - [upgrade](#upgrade)
  - [versions](#versions)
- [Configuration](#configuration)
- [AI-Enhanced Features](#ai-enhanced-features)
- [Programmatic Usage](#programmatic-usage)

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

## Commands

Lex provides a comprehensive set of commands to help you develop, test, and deploy your applications. Each command has detailed documentation (linked below) as well as test documentation that explains how the command is tested ([test documentation files](packages/lex/src/commands)).

### `init`

Creates a new application using a template package. [Detailed documentation](packages/lex/src/commands/init/init.docs.md)

```shell
lex init <app-name> [template-package] [options]
```

Options:
- `--install, -i`: Install dependencies after creation
- `--typescript, -t`: Use TypeScript templates
- `--packageManager, -p`: Package manager to use (npm or yarn)

### `ai`

Provides AI assistance for various development tasks.

```shell
lex ai [options]
```

Options:
- `--task <generate|explain|test|optimize|help>`: Type of AI assistance to request
- `--prompt <text>`: The prompt to send to the AI
- `--file <path>`: Path to a file to include as context
- `--context`: Include project context in the AI request
- `--model <model>`: AI model to use (default: gpt-4o)

Examples:
```shell
# Get help with a development question
lex ai --prompt "How do I implement infinite scrolling in React?"

# Generate code based on a description
lex ai --task generate --prompt "Create a React component for a responsive navbar"

# Explain code in a specific file
lex ai --task explain --file src/components/Button.tsx

# Generate tests for a component
lex ai --task test --file src/components/Form.tsx

# Get optimization suggestions
lex ai --task optimize --file webpack.config.js
```

### `dev`

Starts a development server with hot module reloading. [Detailed documentation](packages/lex/src/commands/dev/dev.docs.md)

```shell
lex dev [options]
```

Options:
- `--open, -o`: Open browser after server starts
- `--port, -p`: Port to run the server on
- `--config, -c`: Path to custom webpack config

### `build`

Builds the application for production. [Detailed documentation](packages/lex/src/commands/build/build.docs.md)

```shell
lex build [options]
```

Options:
- `--config, -c`: Path to custom webpack config
- `--analyze, -a`: Analyze the bundle size

### `test`

Runs tests using Jest with enhanced AI capabilities. [Detailed documentation](packages/lex/src/commands/test/test.docs.md)

```shell
lex test [options]
```

Options:
- `--generate`: Use AI to generate test cases for untested code
- `--analyze`: Use AI to analyze test coverage and suggest improvements
- `--debugTests`: Use AI to debug test failures and suggest fixes
- `--collectCoverage`: Collect coverage information
- `--watch`: Watch for changes and rerun tests

### `lint`

Lints your code using ESLint. [Detailed documentation](packages/lex/src/commands/lint/lint.docs.md)

```shell
lex lint [options]
```

Options:
- `--fix`: Automatically fix problems
- `--aifix`: Use AI to fix problems that standard ESLint can't resolve

### `clean`

Cleans build artifacts and cache files. [Detailed documentation](packages/lex/src/commands/clean/clean.docs.md)

```shell
lex clean [options]
```

Options:
- `--all, -a`: Clean all caches and build directories

### `compile`

Compiles source code using ESBuild or Webpack. [Detailed documentation](packages/lex/src/commands/compile/compile.docs.md)

```shell
lex compile [options]
```

Options:
- `--watch, -w`: Watch for changes and recompile
- `--config, -c`: Path to custom config file

### `config`

Manages Lex configuration. [Detailed documentation](packages/lex/src/commands/config/config.docs.md)

```shell
lex config [options]
```

Options:
- `--get <key>`: Get a configuration value
- `--set <key> <value>`: Set a configuration value
- `--reset`: Reset configuration to defaults

### `copy`

Copies files or directories. [Detailed documentation](packages/lex/src/commands/copy/copy.docs.md)

```shell
lex copy <source> <destination> [options]
```

Options:
- `--overwrite, -o`: Overwrite existing files
- `--verbose, -v`: Show detailed output

### `create`

Creates a new component or module from a template. [Detailed documentation](packages/lex/src/commands/create/create.docs.md)

```shell
lex create <type> <name> [options]
```

Options:
- `--typescript, -t`: Use TypeScript templates
- `--path, -p`: Path where the item should be created

### `link`

Links packages for local development. [Detailed documentation](packages/lex/src/commands/link/link.docs.md)

```shell
lex link [package] [options]
```

Options:
- `--global, -g`: Link globally installed package
- `--force, -f`: Force linking even if already linked

### `migrate`

Migrates projects between different versions or configurations. [Detailed documentation](packages/lex/src/commands/migrate/migrate.docs.md)

```shell
lex migrate [options]
```

Options:
- `--from <version>`: Source version
- `--to <version>`: Target version

### `publish`

Publishes packages to npm. [Detailed documentation](packages/lex/src/commands/publish/publish.docs.md)

```shell
lex publish [options]
```

Options:
- `--access <public|restricted>`: Package access level
- `--tag <tag>`: Distribution tag
- `--otp <code>`: One-time password for npm

### `update`

Updates all dependencies in a project to their latest versions. [Detailed documentation](packages/lex/src/commands/update/update.docs.md)

```shell
lex update [options]
```

Options:
- `--interactive, -i`: Run in interactive mode
- `--packageManager, -p`: Package manager to use (npm or yarn)
- `--registry, -r`: Specify npm registry

### `upgrade`

Upgrades Lex itself to the latest version. [Detailed documentation](packages/lex/src/commands/upgrade/upgrade.docs.md)

```shell
lex upgrade [options]
```

Options:
- `--cliPackage <package>`: Custom CLI package name

### `versions`

Displays versions of Lex and its main dependencies. [Detailed documentation](packages/lex/src/commands/versions/versions.docs.md)

```shell
lex versions [options]
```

Options:
- `--json`: Output versions in JSON format

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

Lex integrates AI capabilities across multiple commands to improve development efficiency and code quality:

### AI Command

The dedicated `ai` command (see [AI Command](#ai) section above) provides direct access to AI assistance for various development tasks including code generation, explanation, testing, and optimization.

### AI-Powered Linting

The `lint` command supports AI-powered fixes for issues that standard ESLint can't automatically resolve:

```bash
# Run linting with AI-powered fixes
lex lint --aifix
```

### AI-Enhanced Testing

The `test` command includes AI capabilities to help with testing:

- **Test Generation** (`--generate`): Automatically generates test cases for untested code
- **Test Analysis** (`--analyze`): Analyzes test coverage and suggests improvements
- **Test Debugging** (`--debugTests`): Provides debugging assistance for failing tests

Example:
```bash
# Full AI-powered testing workflow
lex test --generate --analyze --debugTests
```

### AI Provider Configuration

Configure your preferred AI provider in your `lex.config.js` file:

```javascript
export default {
  ai: {
    provider: 'openai', // 'openai', 'anthropic', 'cursor', 'copilot', or 'none'
    apiKey: 'your-api-key', // Optional if using environment variables
    model: 'gpt-4o'
  }
}
```

If no AI provider is configured when you run an AI-powered command, Lex will prompt you to choose a provider or look for environment variables (e.g., `OPENAI_API_KEY`).

For detailed documentation on AI features, see `packages/lex/docs/ai-configuration.md`.

## Programmatic Usage

In addition to the command-line interface, you can use Lex programmatically in your JavaScript or TypeScript applications:

```javascript
// ESM import
import {init, dev, build, test, lint} from '@nlabs/lex';

// CommonJS require
const {init, dev, build, test, lint} = require('@nlabs/lex');
```

### Examples

#### Initialize a new project:

```javascript
import {init} from '@nlabs/lex';

await init('my-app', '', {
  typescript: true,
  install: true
});
```

#### Run development server:

```javascript
import {dev} from '@nlabs/lex';

await dev({
  open: true,
  port: 3000
});
```

#### Build for production:

```javascript
import {build} from '@nlabs/lex';

await build({
  analyze: true
});
```

#### Run tests:

```javascript
import {test} from '@nlabs/lex';

await test({
  collectCoverage: true,
  verbose: true
});
```

#### Lint code:

```javascript
import {lint} from '@nlabs/lex';

await lint({
  fix: true,
  paths: ['src']
});
```

Each command returns a Promise that resolves to a number representing the exit code (0 for success, non-zero for failure).
