# Copy Module API Documentation

The copy module provides functionality to copy files and directories from one location to another.

## API

### `copy(from: string, to: string, options: CopyOptions, callback?: CopyCallback): Promise<number>`

The main function that handles file and directory copying.

#### Parameters

- `from`: Source path of the file or directory to copy
- `to`: Destination path where the file or directory will be copied to
- `options`: An object containing the copy configuration options
  - `cliName?: string` - Custom name for the CLI tool in output messages (defaults to "Lex")
  - `quiet?: boolean` - Whether to suppress output
- `callback`: An optional callback function that receives the exit status code, defaults to an empty function

#### Returns

- `Promise<number>`: A promise that resolves to the exit code (0 for success, 1 for failure)

## Interfaces

### `CopyOptions`

```typescript
export interface CopyOptions {
  readonly cliName?: string;
  readonly quiet?: boolean;
}
```

### `CopyCallback`

```typescript
export type CopyCallback = (status: number) => void;
```

## Features

- **File Copying**: Copies individual files from one location to another
- **Directory Copying**: Recursively copies directories and their contents
- **Error Handling**: Provides detailed error messages for common issues:
  - Source path not found
  - Permission errors
  - Other file system errors
- **Custom CLI Name**: Supports custom CLI name for output messages
- **Quiet Mode**: Supports suppressing output for automated usage

## Example Usage

```typescript
import { copy } from '@nlabs/lex';

// Basic usage to copy a file
await copy('./source.txt', './destination.txt', {});

// Copy a directory with quiet output
await copy('./source-dir', './destination-dir', {
  quiet: true
});

// Copy with custom CLI name
await copy('./source.txt', './destination.txt', {
  cliName: 'MyTool'
});

// With custom callback
await copy('./source.txt', './destination.txt', {}, (status) => {
  if (status === 0) {
    console.log('Copy completed successfully');
  } else {
    console.error('Copy failed');
  }
});
``` 