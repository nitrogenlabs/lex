# Versions Command

The versions command displays the versions of Lex and its main dependencies.

## API

```typescript
export interface VersionsCmd {
  readonly json?: boolean;
}

export const versions = (cmd: VersionsCmd, callback: (status: number) => void): Promise<number>

export const parseVersion = (packageVersion: string): string

export const packages = {
  swc: string,
  jest: string,
  lex: string,
  typescript: string,
  webpack: string
}

export const jsonVersions = (lexPackages) => object
```

## Options

- `json`: Whether to display the versions in JSON format (defaults to false)

## Example

```typescript
import {versions} from '@nlabs/lex';

// Display versions in text format
await versions({});

// Display versions in JSON format
await versions({
  json: true
});
```

## Returns

Returns a Promise that resolves to:
- `0` always (the command doesn't fail)

## Behavior

1. If the `json` option is true, outputs the versions in JSON format to the console
2. Otherwise, displays the versions in a formatted text output
3. Always returns 0 as the exit code

## Utility Functions

- `parseVersion`: Removes the caret (^) from a package version string
- `packages`: An object containing the versions of Lex and its main dependencies
- `jsonVersions`: Converts an object of package versions to a JSON-friendly format