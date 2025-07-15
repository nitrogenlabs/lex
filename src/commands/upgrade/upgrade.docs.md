# Upgrade Command

The upgrade command updates the CLI tool itself to the latest version available on npm.

## API

```typescript
export interface UpgradeOptions {
  readonly cliName?: string;
  readonly cliPackage?: string;
  readonly quiet?: boolean;
}

export type UpgradeCallback = typeof process.exit;

export const upgrade = async (cmd: UpgradeOptions, callback: UpgradeCallback = process.exit): Promise<number>
```

## Options

- `cliName`: The name of the CLI tool (defaults to "Lex")
- `cliPackage`: The npm package name of the CLI tool (defaults to "@nlabs/lex")
- `quiet`: Whether to suppress output

## Example

```typescript
import {upgrade} from '@nlabs/lex';

// Upgrade the CLI tool
await upgrade({});

// Upgrade a custom CLI tool
await upgrade({
  cliName: 'MyCLI',
  cliPackage: '@myorg/cli'
});
```

## Returns

Returns a Promise that resolves to:
- `0` if the upgrade was successful or the tool is already at the latest version
- `1` if there was an error

## Behavior

1. Displays status message
2. Parses configuration from LexConfig
3. Checks the latest version available on npm
4. Compares the latest version with the current version
5. If already on the latest version, displays a message and exits
6. If a newer version is available, installs the latest version globally
7. Returns success or error code 