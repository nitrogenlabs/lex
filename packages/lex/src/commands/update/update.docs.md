# Update Command

The update command updates all dependencies in a project to their latest versions.

## API

```typescript
export interface UpdateOptions {
  readonly cliName?: string;
  readonly interactive?: boolean;
  readonly packageManager?: string;
  readonly quiet?: boolean;
  readonly registry?: string;
}

export type UpdateCallback = typeof process.exit;

export const update = async (cmd: UpdateOptions, callback: UpdateCallback = process.exit): Promise<number>
```

## Options

- `cliName`: The name of the CLI tool (defaults to "Lex")
- `interactive`: Whether to run the update in interactive mode
- `packageManager`: The package manager to use (npm or yarn, defaults to npm)
- `quiet`: Whether to suppress output
- `registry`: The npm registry to use

## Example

```typescript
import {update} from '@nlabs/lex';

// Update packages using npm
await update({
  packageManager: 'npm'
});

// Update packages using yarn in interactive mode
await update({
  packageManager: 'yarn',
  interactive: true
});

// Update packages with a custom registry
await update({
  registry: 'https://registry.npmjs.org'
});
```

## Returns

Returns a Promise that resolves to:
- `0` if the update was successful
- `1` if there was an error

## Behavior

1. Displays status message
2. Parses configuration from LexConfig
3. Determines package manager (npm or yarn)
4. For npm:
   - Runs npm-check-updates to update dependencies
   - Runs npm install with --force
   - Runs npm audit fix
5. For yarn:
   - Runs yarn upgrade --latest or yarn upgrade-interactive --latest
6. Returns success or error code 