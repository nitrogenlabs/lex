# Config Module API Documentation

The config module provides functionality to generate and output configuration for various parts of the Lex toolchain, including app, Vitest, and Webpack configurations.

## API

### `config(type: string, options: ConfigOptions, callback?: ConfigCallback): Promise<number>`

The main function that handles configuration generation and output.

#### Parameters

- `type`: The type of configuration to generate. Must be one of:
  - `'app'` - Application configuration from LexConfig
  - `'vitest'` - Vitest testing configuration
  - `'webpack'` - Webpack bundling configuration

- `options`: An object containing the configuration options
  - `cliName?: string` - Custom name for the CLI tool in output messages (defaults to "Lex")
  - `json?: string` - Path to save the JSON output to (if not provided, output is not saved to a file)
  - `quiet?: boolean` - Whether to suppress output

- `callback`: An optional callback function that receives the exit status code, defaults to an empty function

#### Returns

- `Promise<number>`: A promise that resolves to the exit code (0 for success, 1 for failure)

## Interfaces

### `ConfigOptions`

```typescript
export interface ConfigOptions {
  readonly cliName?: string;
  readonly json?: string;
  readonly quiet?: boolean;
}
```

### `ConfigCallback`

```typescript
export type ConfigCallback = (status: number) => void;
```

## Features

- **Multiple Configuration Types**: Supports generating app, Vitest, and Webpack configurations
- **JSON Output**: Can save the generated configuration to a JSON file
- **Custom CLI Name**: Supports custom CLI name for output messages
- **Quiet Mode**: Supports suppressing output for automated usage

## Example Usage

```typescript
import { config } from '@nlabs/lex';

// Basic usage to get app configuration
await config('app', {});

// Save Vitest configuration to a JSON file
await config('vitest', { json: './vitest-config.json' });

// Get Webpack configuration with custom CLI name and quiet output
await config('webpack', {
  cliName: 'MyTool',
  quiet: true
});

// With custom callback
await config('app', {}, (status) => {
  if (status === 0) {
    console.log('Configuration generated successfully');
  } else {
    console.error('Configuration generation failed');
  }
});
``` 
