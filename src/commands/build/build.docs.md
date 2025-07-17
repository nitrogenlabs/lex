# Lex Build Command

## Overview

The `build` command compiles your project for production deployment. It supports multiple bundlers and configuration options to tailor the build process to your specific needs.

## Basic Usage

```bash
lex build [options]
```

## Bundler Options

Lex supports multiple bundling engines:

```bash
# Using webpack (default)
lex build

# Using esbuild
lex build --bundler esbuild
```

## AI-Assisted Features

The build command includes AI capabilities to help with error resolution and optimization:

```bash
# Get AI assistance when build errors occur
lex build --assist

# Get AI analysis and optimization suggestions after a successful build
lex build --analyze

# Use both AI features together
lex build --assist --analyze
```

> **Note:** For backward compatibility, the previous option names (`--assist`, `--analyze`) are still supported but considered deprecated.

## Common Options

```bash
# Remove output directory before building
lex build --remove

# Watch for changes and rebuild
lex build --watch

# Set environment variables
lex build --variables "{\"NODE_ENV\": \"production\", \"API_URL\": \"https://api.example.com\"}"

# Specify output path
lex build --outputPath ./dist

# Specify source path
lex build --sourcePath ./src

# Generate TypeScript
lex build --typescript
```

## Options Reference

### Core Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--assist` | boolean | `false` | Enable AI assistance for fixing build errors |
| `--analyze` | boolean | `false` | Enable AI analysis for build optimization suggestions or invoke webpack-bundle-analyzer plugin |
| `--bundler` | string | `webpack` | Bundler to use (`webpack` or `esbuild`) |
| `--cliName` | string | `Lex` | Custom name for the CLI tool in output messages |
| `--format` | string | `cjs` | Output format for generated JavaScript files (`cjs` or `esm`) |
| `--outputPath` | string | - | The output directory as absolute path |
| `--quiet` | boolean | `false` | No Lex notifications printed in the console |
| `--remove` | boolean | `false` | Removes all files from the output directory before compiling |
| `--sourcePath` | string | - | Source path for finding input files |
| `--variables` | string | - | Environment variables to set in "process.env" |
| `--watch` | boolean | `false` | Watch for changes and rebuild |

### Webpack-Specific Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--config` | string | - | Custom Webpack configuration file path (i.e., webpack.config.js) |
| `--configName` | string[] | - | Name of the configuration to use |
| `--defineProcessEnvNodeEnv` | string | - | Sets process.env.NODE_ENV to the specified value |
| `--devtool` | string | - | Developer tool to enhance debugging |
| `--disableInterpret` | boolean | `false` | Disable interpret for loading the config file |
| `--entry` | string[] | - | Module that is loaded upon startup |
| `--env` | string | - | Environment passed to the configuration when it is a function |
| `--failOnWarnings` | boolean | `false` | Stop webpack-cli process with non-zero exit code on warnings |
| `--json` | string | - | Print result as JSON or store it in a file |
| `--lexConfig` | string | - | Lex configuration file path (lex.config.js) |
| `--merge` | boolean | `false` | Merge two or more configurations using "webpack-merge" |
| `--mode` | string | `development` | Webpack mode (`production` or `development`) |
| `--name` | string | - | Name of the configuration when loading multiple configurations |
| `--noDevtool` | boolean | `false` | Negative "devtool" option |
| `--noStats` | boolean | `false` | Negative "stats" option |
| `--noTarget` | boolean | `false` | Negative "target" option |
| `--noWatch` | boolean | `false` | Negative "watch" option |
| `--noWatchOptionsStdin` | boolean | `false` | Negative "watch-options-stdin" option |
| `--nodeEnv` | string | - | Sets process.env.NODE_ENV to the specified value |
| `--stats` | string | - | Stats options object or preset name |
| `--static` | boolean | `false` | Creates static HTML files when building app |
| `--target` | string | - | Environment to build for |
| `--typescript` | boolean | `false` | Transpile as TypeScript |
| `--watchOptionsStdin` | boolean | `false` | Stop watching when stdin stream has ended |

### ESBuild-Specific Options

When using esbuild as the bundler, the following configuration options are available through the `esbuild` section in your `lex.config.js`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `platform` | string | `node` | Target platform (`node`, `browser`) |
| `target` | string | `node20` | Target environment |
| `sourcemap` | string | `inline` | Source map generation |
| `minify` | boolean | `true` | Enable minification |
| `treeShaking` | boolean | `true` | Enable tree shaking |
| `drop` | string[] | - | Console and debugger statements to drop |
| `pure` | string[] | - | Functions to mark as pure |
| `legalComments` | string | - | Legal comments handling |
| `splitting` | boolean | `true` | Enable code splitting |
| `metafile` | boolean | `false` | Generate metafile |
| `banner` | object | - | Banner text for output files |
| `footer` | object | - | Footer text for output files |
| `define` | object | - | Global variable definitions |

## Using with esbuild

When using esbuild as the bundler, the following options apply:

```bash
lex build --bundler esbuild --format esm --typescript
```

esbuild is optimized for speed and produces smaller bundles, making it ideal for library projects or when you want faster build times.

## Using with webpack

Webpack is the default bundler with more features for complex applications:

```bash
lex build --mode production --analyze
```

Webpack provides more advanced features like code splitting, tree shaking, and extensive plugin ecosystem.

## Configuration Files

You can specify a custom configuration file:

```bash
# Custom webpack config
lex build --config ./custom-webpack.config.js

# Custom Lex config
lex build --lexConfig ./lex.config.js
```

## Examples

### Basic Production Build

```bash
lex build --mode production --remove
```

### Watch Mode with TypeScript

```bash
lex build --typescript --watch
```

### Build with Bundle Analysis

```bash
lex build --analyze --mode production
```

### Build with AI Optimization Analysis

```bash
lex build --mode production --analyze
```

### Build with Custom Environment Variables

```bash
lex build --variables "{\"API_URL\": \"https://prod.api.example.com\", \"FEATURE_FLAGS\": {\"newUI\": true}}"
```

### ESM Output for Node Libraries

```bash
lex build --bundler esbuild --format esm --target node22
```

### Webpack with Custom Configuration

```bash
lex build --config ./webpack.prod.js --mode production --devtool source-map
```

### Webpack with Multiple Entry Points

```bash
lex build --entry ./src/index.js --entry ./src/worker.js --name main
```
