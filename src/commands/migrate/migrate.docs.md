# Migrate Command

The `migrate` command helps migrate an application by removing conflicting modules and reinstalling dependencies.

## API

```typescript
migrate(
  options: MigrateOptions,
  callback?: MigrateCallback
): Promise<number>
```

### Parameters

- `options` (MigrateOptions): Configuration options for the migrate command.
- `callback` (MigrateCallback, optional): A callback function that is called with the exit status code when the command completes. Defaults to `process.exit`.

### Options

The `MigrateOptions` interface provides the following options:

```typescript
interface MigrateOptions {
  readonly cliName?: string;        // Custom CLI name to display in messages (default: 'Lex')
  readonly packageManager?: string; // Package manager to use for installation (default: from config or 'npm')
  readonly quiet?: boolean;         // Suppress non-essential output (default: false)
}
```

### Return Value

Returns a Promise that resolves to a number representing the exit status code:
- `0`: Success
- `1`: Error

## Examples

### Basic Usage

```typescript
import {migrate} from 'lex';

// Migrate the application using default options
await migrate({});
```

### Using Custom Package Manager

```typescript
import {migrate} from 'lex';

// Migrate the application using Yarn
await migrate({
  packageManager: 'yarn'
});
```

### Using Custom CLI Name

```typescript
import {migrate} from 'lex';

// Migrate the application with custom CLI name
await migrate({
  cliName: 'MyTool'
});
```

### Quiet Mode

```typescript
import {migrate} from 'lex';

// Migrate the application in quiet mode
await migrate({
  quiet: true
});
```

## Behavior

1. Displays a status message indicating that the command is removing node modules
2. Removes the node_modules directory
3. Loads the package.json file
4. Removes conflicting modules from dependencies and devDependencies
5. Reinstalls all dependencies using the specified package manager
6. Returns a success or error status code

## Notes

This command is useful when migrating an application to a new version of Lex or when resolving dependency conflicts. It removes modules that might conflict with Lex's own dependencies (like ESBuild, Jest, and Webpack) and then reinstalls all dependencies. 