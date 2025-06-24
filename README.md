# @nlabs/lex

**Supercharge your development workflow with Lex** – the all-in-one CLI powerhouse that transforms how you build React applications. Say goodbye to complex configurations and hello to seamless productivity!

Lex isn't just another CLI tool – it's your development accelerator. With zero configuration needed, Lex handles everything from testing to building, letting you focus on what matters most: creating exceptional code. Powered by industry-leading tools like ESBuild, Jest, TypeScript, and Webpack, Lex delivers enterprise-grade performance with startup-speed simplicity.

### Why developers love Lex:

- **⚡ Lightning-Fast Builds** with [ESBuild](https://esbuild.github.io/) – Experience builds up to 100x faster than traditional bundlers
- **🧪 Painless Testing** with [Jest](https://facebook.github.io/jest/) – Automated testing with AI-powered test generation and debugging
- **🛡️ Type Safety** with [TypeScript](http://www.typescriptlang.org/) – Catch errors before they happen with seamless TypeScript integration
- **📦 Optimized Bundling** with [Webpack](https://webpack.js.org/) – Production-ready bundles with automatic optimizations
- **🤖 AI-Enhanced Development** – Leverage AI to generate tests, optimize code, and solve complex problems
- **🚀 Zero Configuration** – Get started in seconds with sensible defaults that just work

Stop wasting time configuring your toolchain and start building amazing applications today with Lex!

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

Get started with Lex in just one command:

```shell
npm install -g @nlabs/lex
```

That's it! You now have access to a complete development toolkit without the hassle of configuring multiple packages.

## Quick Start

Launch your next project in minutes:

```shell
# Create a new app with the ArkhamJS framework
$ npm install -g @nlabs/lex
$ lex init myApp -i
$ cd myApp

# Start the development server with hot reloading
$ lex dev -o
```

Your browser will automatically open with your new application running. Make changes to your code and watch as they instantly appear in your browser – no refresh needed!

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
- `--fix`: Automatically fix problems (including AI-powered fixes when configured)

When AI is configured in your `lex.config.js`, the `--fix` option will automatically use AI to fix problems that standard ESLint can't resolve.

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

**Develop at the speed of thought with Lex's AI-powered capabilities!** Lex seamlessly integrates cutting-edge AI technology across its commands, revolutionizing your development workflow:

### AI Command

The dedicated `ai` command provides your personal AI development assistant right in the terminal. Ask questions, generate code, explain complex logic, and optimize your application without ever leaving your workflow.

```bash
# Generate a complex React component in seconds
lex ai --task generate --prompt "Create a responsive data table with sorting and filtering"
```

### AI-Powered Linting

Lex provides an advanced AI-powered linting capability that goes beyond traditional ESLint rules. When you use the `--fix` option with the lint command, Lex will:

1. Run standard ESLint with automatic fixes
2. Analyze remaining errors that couldn't be fixed automatically
3. Use AI (configurable in your lex.config.js) to intelligently fix complex issues

This feature is especially helpful for:

- Fixing complex logical errors
- Improving code readability
- Resolving edge cases that standard linting rules can't handle

#### Usage:

```shell
# Run linting with AI fixes
lex lint --fix

# Or use the npm script if you've set it up
npm run lint:ai
```

#### Configuration:

Configure the AI provider in your `lex.config.js`:

```js
export default {
  // Other configuration...
  
  ai: {
    // AI provider: 'cursor', 'copilot', 'openai', 'anthropic', or 'none'
    provider: 'cursor',
    
    // Optional API key for external providers (recommended to use environment variables)
    // apiKey: process.env.OPENAI_API_KEY,
    
    // AI model to use
    model: 'cursor-code',
    
    // Additional parameters
    maxTokens: 4000,
    temperature: 0.1
  }
};
```

### AI-Enhanced Testing

Transform testing from a chore into a superpower with Lex's intelligent testing suite:

- **Smart Test Generation** – Automatically create comprehensive test suites for untested code
- **Coverage Analysis** – Get AI-powered insights on how to improve your test coverage
- **Intelligent Debugging** – When tests fail, AI pinpoints the root cause and suggests fixes

```bash
# Let AI handle your entire testing workflow
lex test --generate --analyze --debugTests
```

### AI Provider Configuration

Lex works with your preferred AI provider, giving you flexibility and control:

```javascript
export default {
  ai: {
    provider: 'openai', // 'openai', 'anthropic', 'cursor', 'copilot', or 'none'
    apiKey: 'your-api-key', // Optional if using environment variables
    model: 'gpt-4o'
  }
}
```

No AI provider configured? No problem! Lex will guide you through setting one up when you run an AI-powered command.

For detailed documentation on AI features, see `packages/lex/docs/ai-configuration.md`.

## Programmatic Usage

**Unleash Lex's full potential in your JavaScript applications!** Beyond the command line, Lex offers a powerful programmatic API that lets you integrate its capabilities directly into your build scripts, automation workflows, or custom tools.

```javascript
// ESM import
import {init, dev, build, test, lint} from '@nlabs/lex';

// CommonJS require
const {init, dev, build, test, lint} = require('@nlabs/lex');
```

### Supercharge Your Scripts

#### Create projects programmatically:

```javascript
import {init} from '@nlabs/lex';

// Perfect for scaffolding tools or CI/CD pipelines
await init('my-app', '', {
  typescript: true,
  install: true
});
```

#### Launch development environments:

```javascript
import {dev} from '@nlabs/lex';

// Ideal for custom launchers or workspace tools
await dev({
  open: true,
  port: 3000
});
```

#### Build for production with analytics:

```javascript
import {build} from '@nlabs/lex';

// Great for deployment scripts
await build({
  analyze: true
});
```

#### Run tests with custom configurations:

```javascript
import {test} from '@nlabs/lex';

// Perfect for CI/CD pipelines
await test({
  collectCoverage: true,
  verbose: true
});
```

#### Lint code with automatic fixes:

```javascript
import {lint} from '@nlabs/lex';

// Excellent for pre-commit hooks
await lint({
  fix: true,
  paths: ['src']
});
```

Each command returns a Promise that resolves to a number representing the exit code (0 for success, non-zero for failure), making it easy to chain operations or handle errors in your scripts.
