# Dev Module API Documentation

The dev module provides functionality to start a development server using webpack with hot reloading.

## API

### `dev(options: DevOptions, callback?: DevCallback): Promise<number>`

The main function that starts a development server using webpack.

#### Parameters

- `options`: An object containing the development server configuration options
  - `bundleAnalyzer?: boolean` - Whether to enable the bundle analyzer (defaults to false)
  - `cliName?: string` - Custom name for the CLI tool in output messages (defaults to "Lex")
  - `config?: string` - Path to a custom webpack configuration file
  - `format?: string` - Output format for generated JavaScript files (`cjs` or `esm`, defaults to "esm")
  - `open?: boolean` - Whether to open the browser automatically (defaults to false)
  - `port?: number` - Port number for the development server (defaults to 3000)
  - `quiet?: boolean` - Whether to suppress output
  - `remove?: boolean` - Whether to clean the output directory before starting (defaults to false)
  - `usePublicIp?: boolean` - Force refresh the cached public IP address (defaults to false)
  - `variables?: string` - JSON string of environment variables to set
- `callback`: An optional callback function that receives the exit status code, defaults to an empty function

#### Returns

- `Promise<number>`: A promise that resolves to the exit code (0 for success, 1 for failure)

## Interfaces

### `DevOptions`

```typescript
export interface DevOptions {
  readonly bundleAnalyzer?: boolean;
  readonly cliName?: string;
  readonly config?: string;
  readonly format?: string;
  readonly open?: boolean;
  readonly port?: number;
  readonly quiet?: boolean;
  readonly remove?: boolean;
  readonly usePublicIp?: boolean;
  readonly variables?: string;
}
```

### `DevCallback`

```typescript
export type DevCallback = (status: number) => void;
```

## Features

- **Webpack Development Server**: Starts a webpack development server with hot reloading
- **Bundle Analyzer**: Optionally enables webpack bundle analyzer
- **Custom Configuration**: Supports custom webpack configuration files
- **Auto-Open Browser**: Optionally opens the browser automatically
- **Environment Variables**: Supports setting custom environment variables
- **Output Directory Cleaning**: Optionally cleans the output directory before starting
- **Public IP Caching**: Caches public IP address for 1 week to reduce API calls
- **Public IP Refresh**: Force refresh cached public IP with `--usePublicIp` flag
- **TypeScript Support**: Automatically checks TypeScript configuration if enabled
- **Error Handling**: Provides detailed error messages for webpack compilation issues
- **Custom CLI Name**: Supports custom CLI name for output messages
- **Quiet Mode**: Supports suppressing output for automated usage

## Example Usage

```typescript
import { dev } from '@nlabs/lex';

// Basic usage
await dev({
  quiet: false
});

// With bundle analyzer and auto-open browser
await dev({
  bundleAnalyzer: true,
  open: true,
  quiet: false
});

// With custom webpack configuration
await dev({
  config: './custom.webpack.config.js',
  quiet: false
});

// With environment variables
await dev({
  variables: '{"API_URL": "https://api.example.com", "DEBUG": true}',
  quiet: false
});

// With output directory cleaning
await dev({
  remove: true,
  quiet: false
});

// With public IP refresh
await dev({
  usePublicIp: true,
  quiet: false
});

// With custom port
await dev({
  port: 8080,
  quiet: false
});

// With custom callback
await dev({
  quiet: false
}, (status) => {
  if (status === 0) {
    console.log('Development server started successfully');
  } else {
    console.error('Failed to start development server');
  }
});
```
