# Link Command

The `linked` command checks for linked npm modules in the current project.

## API

```typescript
linked(
  options: LinkOptions,
  callback?: LinkCallback
): Promise<number>
```

### Parameters

- `options` (LinkOptions): Configuration options for the link command.
- `callback` (LinkCallback, optional): A callback function that is called with the exit status code when the command completes.

### Options

The `LinkOptions` interface provides the following options:

```typescript
interface LinkOptions {
  readonly cliName?: string; // Custom CLI name to display in messages (default: 'Lex')
  readonly quiet?: boolean;  // Suppress non-essential output (default: false)
}
```

### Return Value

Returns a Promise that resolves to a number representing the exit status code:
- `0`: Success

## Examples

### Basic Usage

```typescript
import {linked} from 'lex';

// Check for linked modules
await linked({});
```

### Using Custom CLI Name

```typescript
import {linked} from 'lex';

// Check for linked modules with custom CLI name
await linked({
  cliName: 'MyTool'
});
```

### Quiet Mode

```typescript
import {linked} from 'lex';

// Check for linked modules in quiet mode
await linked({
  quiet: true
});
```

## Behavior

1. Displays a status message indicating that the command is checking for linked modules
2. Parses the Lex configuration
3. Checks for linked modules in the current project
4. Returns a success status code

## Notes

This command is useful for identifying npm modules that are linked in the current project using `npm link`. Linked modules are typically used during development to test local changes to dependencies without publishing them to npm. 