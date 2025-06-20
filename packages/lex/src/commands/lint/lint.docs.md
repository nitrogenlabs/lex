# Lint Module API Documentation

The lint module provides ESLint integration for Lex projects, with automatic detection and setup of TypeScript configurations.

## API

### `lint(options: LintOptions, callback?: LintCallback): Promise<number>`

The main function that handles ESLint execution with various configuration options.

#### Parameters

- `options`: An object containing the linting configuration options
  - `aifix?: boolean` - Whether to apply AI-powered fixes to linting errors that couldn't be fixed automatically
  - `cache?: boolean` - Whether to use ESLint caching
  - `cacheFile?: string` - Path to the ESLint cache file
  - `cacheLocation?: string` - Directory to store the ESLint cache
  - `cliName?: string` - Custom name for the CLI tool in output messages (defaults to "Lex")
  - `color?: boolean` - Whether to use colors in output
  - `config?: string` - Path to a custom ESLint configuration file
  - `debug?: boolean` - Whether to output debug information
  - `env?: string` - Environment for ESLint rules
  - `envInfo?: boolean` - Whether to output environment information
  - `ext?: string` - File extensions to lint
  - `fix?: boolean` - Whether to automatically fix problems
  - `fixDryRun?: boolean` - Whether to run autofix without saving the changes
  - `fixType?: string` - Specify the types of fixes to apply
  - `format?: string` - Output format for ESLint results
  - `global?: string` - Global variables to define
  - `ignorePath?: string` - Path to the ignore file
  - `ignorePattern?: string` - Pattern of files to ignore
  - `init?: boolean` - Whether to run ESLint initialization
  - `maxWarnings?: string` - Number of warnings to trigger nonzero exit code
  - `noColor?: boolean` - Whether to disable colors in output
  - `noEslintrc?: boolean` - Whether to disable ESLint configuration file loading
  - `noIgnore?: boolean` - Whether to disable ignore file
  - `noInlineConfig?: boolean` - Whether to disable inline configuration
  - `outputFile?: string` - Path to write the output to
  - `parser?: string` - Parser to use
  - `parserOptions?: string` - Parser options
  - `plugin?: string` - ESLint plugins to use
  - `printConfig?: string` - Print the configuration for the given file
  - `quiet?: boolean` - Whether to suppress output except for errors
  - `reportUnusedDisableDirectives?: boolean` - Whether to report unused eslint-disable directives
  - `resolvePluginsRelativeTo?: string` - Directory to resolve plugins relative to
  - `rule?: string` - Rules to use
  - `rulesdir?: string` - Directory with custom rules
  - `stdin?: boolean` - Whether to lint code from stdin
  - `stdinFilename?: string` - Filename to assign to stdin input

- `callback`: An optional callback function to handle process exit, defaults to `process.exit`

#### Returns

- `Promise<number>`: A promise that resolves to the exit code (0 for success, 1 for failure)

## Interfaces

### `LintOptions`

```typescript
export interface LintOptions {
  readonly cache?: boolean;
  readonly cacheFile?: string;
  readonly cacheLocation?: string;
  readonly cliName?: string;
  readonly color?: boolean;
  readonly config?: string;
  readonly debug?: boolean;
  readonly env?: string;
  readonly envInfo?: boolean;
  readonly ext?: string;
  readonly fix?: boolean;
  readonly fixDryRun?: boolean;
  readonly fixType?: string;
  readonly format?: string;
  readonly global?: string;
  readonly ignorePath?: string;
  readonly ignorePattern?: string;
  readonly init?: boolean;
  readonly maxWarnings?: string;
  readonly noColor?: boolean;
  readonly noEslintrc?: boolean;
  readonly noIgnore?: boolean;
  readonly noInlineConfig?: boolean;
  readonly outputFile?: string;
  readonly parser?: string;
  readonly parserOptions?: string;
  readonly plugin?: string;
  readonly printConfig?: string;
  readonly quiet?: boolean;
  readonly reportUnusedDisableDirectives?: boolean;
  readonly resolvePluginsRelativeTo?: string;
  readonly rule?: string;
  readonly rulesdir?: string;
  readonly stdin?: boolean;
  readonly stdinFilename?: string;
  readonly aifix?: boolean;
}
```

### `LintCallback`

```typescript
export type LintCallback = typeof process.exit;
```

## Features

- **TypeScript Detection**: Automatically detects TypeScript projects and configures ESLint appropriately.
- **ESLint Configuration**: Provides a default ESLint configuration if none is found in the project.
- **AI-Powered Fixes**: Can apply AI fixes to linting issues that can't be automatically fixed.
- **Fallback Fixes**: When AI is unavailable, applies rule-based fixes for common issues.
- **ESM Support**: Ensures package.json is configured for ESM support. 