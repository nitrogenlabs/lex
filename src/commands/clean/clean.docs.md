# Clean Module API Documentation

The clean module provides functionality to clean up project files and directories, such as node_modules, coverage reports, and test snapshots.

## API

### `clean(options: CleanOptions, callback?: CleanCallback): Promise<number>`

The main function that handles cleaning operations.

#### Parameters

- `options`: An object containing the cleaning configuration options
  - `cliName?: string` - Custom name for the CLI tool in output messages (defaults to "Lex")
  - `quiet?: boolean` - Whether to suppress output
  - `snapshots?: boolean` - Whether to remove test snapshots

- `callback`: An optional callback function that receives the exit status code, defaults to an empty function

#### Returns

- `Promise<number>`: A promise that resolves to the exit code (0 for success, 1 for failure)

## Interfaces

### `CleanOptions`

```typescript
export interface CleanOptions {
  readonly cliName?: string;
  readonly quiet?: boolean;
  readonly snapshots?: boolean;
}
```

### `CleanCallback`

```typescript
export type CleanCallback = (status: number) => void;
```

## Features

- **Node Modules Removal**: Removes the node_modules directory
- **Coverage Reports Removal**: Removes test coverage reports
- **NPM Debug Logs Removal**: Removes npm-debug.log files
- **Test Snapshots Removal**: Optionally removes Vitest snapshots
- **Custom Configuration**: Uses LexConfig for custom configuration

## Example Usage

```typescript
import { clean } from '@nlabs/lex';

// Basic usage with default options
await clean({});

// Clean with snapshots removal
await clean({ snapshots: true });

// Clean with custom CLI name and quiet output
await clean({
  cliName: 'MyTool',
  quiet: true
});

// Clean with custom callback
await clean({}, (status) => {
  if (status === 0) {
    console.log('Cleaning completed successfully');
  } else {
    console.error('Cleaning failed');
  }
});
``` 
