# Storybook Module API Documentation

The storybook module provides functionality to start a Storybook development server or build a static Storybook site.

## API

### `storybook(options: StorybookOptions, callback?: StorybookCallback): Promise<number>`

The main function that starts Storybook development server or builds a static site.

#### Parameters

- `options`: An object containing the Storybook configuration options
  - `cliName?: string` - Custom name for the CLI tool in output messages (defaults to "Lex")
  - `config?: string` - Path to a custom Storybook configuration directory
  - `open?: boolean` - Whether to open the browser automatically (defaults to false)
  - `port?: number` - Port number for the Storybook server
  - `quiet?: boolean` - Whether to suppress output
  - `static?: boolean` - Whether to build a static Storybook site instead of starting dev server (defaults to false)
  - `variables?: string` - JSON string of environment variables to set
- `callback`: An optional callback function that receives the exit status code, defaults to an empty function

#### Returns

- `Promise<number>`: A promise that resolves to the exit code (0 for success, 1 for failure)

## Interfaces

### `StorybookOptions`

```typescript
export interface StorybookOptions {
  readonly cliName?: string;
  readonly config?: string;
  readonly open?: boolean;
  readonly port?: number;
  readonly quiet?: boolean;
  readonly static?: boolean;
  readonly variables?: string;
}
```

### `StorybookCallback`

```typescript
export type StorybookCallback = (status: number) => void;
```

## Features

- **Story File Detection**: Automatically finds story files with patterns like `*.stories.{ts,tsx,js,jsx}`, `*.story.{ts,tsx,js,jsx}`, and files in `stories/` directories
- **Storybook Installation Check**: Verifies that Storybook is installed in the project before running
- **Development Server**: Starts Storybook development server with hot reloading
- **Static Build**: Optionally builds a static Storybook site for deployment
- **Custom Configuration**: Supports custom Storybook configuration directories
- **Auto-Open Browser**: Optionally opens the browser automatically
- **Custom Port**: Supports specifying a custom port for the development server
- **Environment Variables**: Supports setting custom environment variables
- **Error Handling**: Provides detailed error messages for Storybook issues
- **Custom CLI Name**: Supports custom CLI name for output messages
- **Quiet Mode**: Supports suppressing output for automated usage

## Example Usage

```typescript
import { storybook } from '@nlabs/lex';

// Basic usage - start development server
await storybook({
  quiet: false
});

// Start with auto-open browser and custom port
await storybook({
  open: true,
  port: 6007,
  quiet: false
});

// Build static site
await storybook({
  static: true,
  quiet: false
});

// With custom configuration directory
await storybook({
  config: './.storybook',
  quiet: false
});

// With environment variables
await storybook({
  variables: '{"STORYBOOK_THEME": "dark", "DEBUG": true}',
  quiet: false
});

// With custom callback
await storybook({
  quiet: false
}, (status) => {
  if (status === 0) {
    console.log('Storybook started successfully');
  } else {
    console.error('Failed to start Storybook');
  }
});
```

## Story File Patterns

The command automatically detects story files using the following patterns:

- `**/*.stories.{ts,tsx,js,jsx}` - Files ending with `.stories.ts`, `.stories.tsx`, `.stories.js`, or `.stories.jsx`
- `**/*.story.{ts,tsx,js,jsx}` - Files ending with `.story.ts`, `.story.tsx`, `.story.js`, or `.story.jsx`
- `**/stories/**/*.{ts,tsx,js,jsx}` - Any TypeScript or JavaScript files in a `stories/` directory

## Supported Storybook Frameworks

The command supports all major Storybook frameworks:

- React (`@storybook/react`)
- Vue (`@storybook/vue`)
- Angular (`@storybook/angular`)
- Web Components (`@storybook/web-components`)
- Generic Storybook (`storybook`)

## Error Handling

The command provides helpful error messages for common issues:

- **Storybook not installed**: Suggests installing the appropriate Storybook package
- **No story files found**: Provides guidance on creating story files
- **Binary not found**: Suggests reinstalling Lex or checking Storybook installation
- **Invalid environment variables**: Validates JSON format for environment variables
