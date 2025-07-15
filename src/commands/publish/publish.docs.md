# Publish Command

The `publish` command publishes an npm module with version bumping support.

## API

```typescript
publish(
  options: PublishOptions,
  callback?: PublishCallback
): Promise<number>
```

### Parameters

- `options` (PublishOptions): Configuration options for the publish command.
- `callback` (PublishCallback, optional): A callback function that is called with the exit status code when the command completes. Defaults to `process.exit`.

### Options

The `PublishOptions` interface provides the following options:

```typescript
interface PublishOptions {
  readonly bump?: string;         // Version bump type (major, minor, patch, alpha, beta, rc)
  readonly cliName?: string;      // Custom CLI name to display in messages (default: 'Lex')
  readonly newVersion?: string;   // Specific version to use (overrides bump)
  readonly otp?: string;          // One-time password for npm two-factor auth
  readonly packageManager?: string; // Package manager to use (default: from config or 'npm')
  readonly private?: boolean;     // Publish as a private package
  readonly quiet?: boolean;       // Suppress non-essential output (default: false)
  readonly tag?: string;          // npm tag to use (e.g., 'latest', 'beta')
}
```

### Return Value

Returns a Promise that resolves to a number representing the exit status code:
- `0`: Success
- `1`: Error

## Examples

### Basic Usage

```typescript
import {publish} from 'lex';

// Publish the current package
await publish({});
```

### Bumping Version

```typescript
import {publish} from 'lex';

// Publish with a patch version bump
await publish({
  bump: 'patch'
});

// Publish with a minor version bump
await publish({
  bump: 'minor'
});

// Publish with a major version bump
await publish({
  bump: 'major'
});

// Publish with a prerelease version bump
await publish({
  bump: 'beta'
});
```

### Using Specific Version

```typescript
import {publish} from 'lex';

// Publish with a specific version
await publish({
  newVersion: '2.0.0'
});
```

### Using Tags

```typescript
import {publish} from 'lex';

// Publish with a beta tag
await publish({
  tag: 'beta'
});
```

### Private Package

```typescript
import {publish} from 'lex';

// Publish as a private package
await publish({
  private: true
});
```

## Behavior

1. Displays a status message indicating that the command is publishing an npm module
2. Parses the Lex configuration
3. Determines the package manager to use
4. Reads the package.json file to get the current version and package name
5. Determines the next version number based on the bump type or uses the specified version
6. Updates the package.json file with the new version (if not using Yarn)
7. Publishes the package using the specified package manager
8. Returns a success or error status code

## Notes

- When using Yarn as the package manager, the version update is handled by Yarn itself using the `--new-version` flag
- For npm, the package.json file is updated manually before publishing
- Valid bump types include:
  - Major releases: 'major'
  - Minor releases: 'minor'
  - Patch releases: 'patch'
  - Pre-releases: 'alpha', 'beta', 'rc' 