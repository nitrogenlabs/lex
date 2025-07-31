# LEX Compilation Module

The compile module is responsible for compiling TypeScript and JavaScript code using ESBuild and managing assets in a Lex project.

## Overview

The compile module provides functionality to:

- Compile TypeScript and JavaScript files using ESBuild
- Run TypeScript type checking
- Process CSS files with PostCSS
- Copy static assets (images, fonts, and documents)
- Support watch mode for development
- Clean output directory

## API

### compile(cmd, callback)

Main function that handles the compilation process.

#### Parameters

- `cmd` (Object): Command options
  - `cliName` (String): Name of the CLI tool (default: "Lex")
  - `config` (String): Path to custom TypeScript config
  - `outputPath` (String): Custom output directory path
  - `quiet` (Boolean): Suppress console output
  - `remove` (Boolean): Clean output directory before compilation
  - `sourcePath` (String): Custom source directory path
  - `watch` (Boolean): Enable watch mode
- `callback` (Function): Callback function called when compilation completes
  - Will be called with `0` for success or `1` for failure

#### Returns

- (Promise<number>): Returns 0 for success, 1 for failure

### hasFileType(startPath, ext)

Utility function to check if a directory contains files with specific extensions.

#### Parameters

- `startPath` (String): Directory path to check
- `ext` (Array<String>): Array of file extensions to look for

#### Returns

- (Boolean): True if files with the matching extensions exist, false otherwise

## Example Usage

```javascript
// Import the compile function
import { compile } from './compile.js';

// Compile with default options
await compile({});

// Compile with custom options
await compile({
  cliName: 'MyTool',
  sourcePath: './src',
  outputPath: './lib',
  watch: true,
  quiet: false,
  remove: true
});

// With callback
await compile({
  sourcePath: './src',
  outputPath: './lib'
}, (exitCode) => {
  if (exitCode === 0) {
    console.log('Compilation succeeded');
  } else {
    console.log('Compilation failed');
  }
});
```

## Workflow

1. Parse configuration from LexConfig
2. Check for linked modules
3. Clean output directory if `remove` option is true
4. If TypeScript is used:
   - Check TypeScript configuration
   - Run static type checking
5. Process CSS files with PostCSS
6. Copy images, fonts, and markdown documents
7. Compile source code with ESBuild
8. Call the callback function with the result status

## Options Reference

| Option | Description | Default |
|--------|-------------|---------|
| `cliName` | Name of the CLI tool | "Lex" |
| `config` | Path to custom TypeScript config | null |
| `outputPath` | Custom output directory | From LexConfig |
| `quiet` | Suppress console output | false |
| `remove` | Clean output directory before compilation | false |
| `sourcePath` | Custom source directory | From LexConfig |
| `watch` | Enable watch mode | false |

## ESBuild Configuration

The compile command uses ESBuild with the following configuration options available through the `esbuild` section in your `lex.config.js`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `format` | string | `esm` | Output format (`esm`, `cjs`) |
| `platform` | string | `node` | Target platform (`node`, `browser`) |
| `sourcemap` | string | `inline` | Source map generation |
| `target` | string | `node20` | Target environment |
| `minify` | boolean | `false` | Enable minification (more conservative for compile) |
| `treeShaking` | boolean | `true` | Enable tree shaking |
| `drop` | string[] | - | Console and debugger statements to drop |
| `pure` | string[] | - | Functions to mark as pure |
| `legalComments` | string | - | Legal comments handling |
| `banner` | object | - | Banner text for output files |
| `footer` | object | - | Footer text for output files |
| `define` | object | - | Global variable definitions |

## TypeScript Support

When TypeScript is enabled in your Lex configuration:

- Uses `tsconfig.build.json` for compilation (created automatically if needed)
- Runs static type checking before compilation
- Supports custom TypeScript configuration via the `--config` option

## CSS Processing

The compile command automatically processes CSS files using PostCSS:

- Processes all `.css` files found in the source directory
- Applies PostCSS plugins configured in your project
- Supports Tailwind CSS and other PostCSS plugins

## Asset Copying

The compile command automatically copies static assets:

- Images (`.jpg`, `.jpeg`, `.png`, `.gif`, `.svg`, `.webp`)
- Fonts (`.woff`, `.woff2`, `.ttf`, `.eot`)
- Documents (`.md`, `.txt`, `.pdf`)

## Watch Mode

When watch mode is enabled:

- Monitors source files for changes
- Automatically recompiles when files are modified
- Provides real-time feedback on compilation status

## Error Handling

The compile command provides detailed error messages for:

- TypeScript compilation errors
- ESBuild compilation errors
- Missing dependencies
- Configuration issues
