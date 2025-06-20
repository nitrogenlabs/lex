# Init Command

The `init` command creates a new application using a template package.

## API

```typescript
init(
  appName: string,
  packageName: string,
  options: InitOptions,
  callback?: InitCallback
): Promise<number>
```

### Parameters

- `appName` (string): The name of the application to create.
- `packageName` (string): The name of the template package to use. If not provided, a default template will be used based on the TypeScript configuration.
- `options` (InitOptions): Configuration options for the init command.
- `callback` (InitCallback, optional): A callback function that is called with the exit status code when the command completes.

### Options

The `InitOptions` interface provides the following options:

```typescript
interface InitOptions {
  readonly cliName?: string;        // Custom CLI name to display in messages (default: 'Lex')
  readonly install?: boolean;       // Whether to install dependencies after creation (default: false)
  readonly packageManager?: string; // Package manager to use for installation (default: from config or 'npm')
  readonly quiet?: boolean;         // Suppress non-essential output (default: false)
  readonly typescript?: boolean;    // Use TypeScript templates (default: from config)
}
```

### Return Value

Returns a Promise that resolves to a number representing the exit status code:
- `0`: Success
- `1`: Error

## Examples

### Basic Usage

```typescript
import {init} from 'lex';

// Create a new app using the default template
await init('my-app', '', {});
```

### Using TypeScript Template

```typescript
import {init} from 'lex';

// Create a new TypeScript app and install dependencies
await init('my-ts-app', '', {
  typescript: true,
  install: true
});
```

### Using Custom Template

```typescript
import {init} from 'lex';

// Create a new app using a custom template
await init('my-custom-app', '@my-org/my-template', {
  install: true,
  packageManager: 'yarn'
});
```

### Using Custom CLI Name

```typescript
import {init} from 'lex';

// Create a new app with custom CLI name
await init('my-app', '', {
  cliName: 'MyTool',
  install: true
});
```

## Behavior

1. Downloads the specified template package (or a default one based on TypeScript configuration)
2. Creates a new directory with the specified app name
3. Configures the package.json file with the new app name and basic information
4. Creates a simple README.md file
5. Optionally installs dependencies using the specified package manager

## Error Handling

The command will exit with a status code of 1 in the following cases:
- The template package cannot be downloaded
- The template files cannot be copied to the destination directory
- The package.json file cannot be updated
- The dependencies cannot be installed (if installation is requested) 