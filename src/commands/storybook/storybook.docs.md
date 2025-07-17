# Storybook Module API Documentation

The storybook module provides functionality to start a Storybook development server or build a static Storybook site with enhanced features like Tailwind CSS integration and flexible configuration management.

## API

### `storybook(options: StorybookOptions, callback?: StorybookCallback): Promise<number>`

The main function that starts Storybook development server or builds a static site.

#### Parameters

- `options`: An object containing the Storybook configuration options
  - `cliName?: string` - Custom name for the CLI tool in output messages (defaults to "Lex")
  - `config?: string` - Path to a custom Storybook configuration directory
  - `open?: boolean` - Whether to open the browser automatically (defaults to false)
  - `port?: number` - Port number for the Storybook server (defaults to 6007)
  - `quiet?: boolean` - Whether to suppress output
  - `static?: boolean` - Whether to build a static Storybook site instead of starting dev server (defaults to false)
  - `useLexConfig?: boolean` - Whether to prefer Lex's Storybook configuration over the project's config (defaults to false)
  - `variables?: string` - JSON string of environment variables to set
  - `verbose?: boolean` - Whether to show verbose output including webpack progress details (defaults to false)
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
  readonly useLexConfig?: boolean;
  readonly variables?: string;
  readonly verbose?: boolean;
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
- **Lex Configuration**: Optionally use Lex's built-in Storybook configuration instead of project config
- **Auto-Open Browser**: Optionally opens the browser automatically
- **Custom Port**: Supports specifying a custom port for the development server (defaults to 6007)
- **Environment Variables**: Supports setting custom environment variables
- **Error Handling**: Provides detailed error messages for Storybook issues
- **Custom CLI Name**: Supports custom CLI name for output messages
- **Quiet Mode**: Supports suppressing output for automated usage
- **Verbose Mode**: Shows detailed webpack progress and build information
- **Tailwind CSS Integration**: Automatically detects and integrates Tailwind CSS files
- **Progress Tracking**: Shows real-time build progress with percentage updates
- **Output Filtering**: Intelligently filters and beautifies Storybook output

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

// Use Lex's Storybook configuration instead of project config
await storybook({
  useLexConfig: true,
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

// With verbose output for debugging
await storybook({
  verbose: true,
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

## Configuration Priority

The command follows this priority order for Storybook configuration:

1. **Custom config path** (if `config` option is provided)
2. **Lex config** (if `useLexConfig: true` is set)
3. **Project config** (if `.storybook` exists in project root)
4. **Lex config** (as fallback)

When using Lex's configuration, the command will:

- Copy Lex's configuration files to a temporary `.storybook` directory in the project
- Update story paths to match the current project structure
- Update module resolution paths to use Lex's node_modules
- Pass Tailwind CSS path via environment variables

## Story File Patterns

The command automatically detects story files using the following patterns:

- `**/*.stories.{ts,tsx,js,jsx}` - Files ending with `.stories.ts`, `.stories.tsx`, `.stories.js`, or `.stories.jsx`
- `**/*.story.{ts,tsx,js,jsx}` - Files ending with `.story.ts`, `.story.tsx`, `.story.js`, or `.story.jsx`
- `**/stories/**/*.{ts,tsx,js,jsx}` - Any TypeScript or JavaScript files in a `stories/` directory

## Tailwind CSS Integration

The command automatically detects Tailwind CSS files in your project:

- Searches for `tailwind.css` files using the pattern `**/tailwind.css`
- Supports nested directory structures
- Passes the detected path to Storybook via environment variables
- Provides feedback on Tailwind CSS detection status

## Output Management

The command provides intelligent output filtering:

- **Normal Mode**: Shows essential Storybook messages, hides webpack progress details
- **Verbose Mode**: Shows all output including webpack progress details
- **Progress Tracking**: Displays real-time build progress with percentage updates
- **Color Coding**: Uses chalk for better visual distinction of different message types

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
- **Configuration not found**: Provides guidance on Storybook initialization
- **Tailwind CSS not found**: Suggests creating a tailwind.css file with proper directives
