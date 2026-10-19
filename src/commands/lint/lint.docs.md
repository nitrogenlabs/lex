# Lint Module API Documentation

The lint module provides ESLint integration for Lex projects, with automatic detection and setup of TypeScript configurations.

## API

### `lint(options: LintOptions, callback?: LintCallback): Promise<number>`

The main function that handles ESLint execution with various configuration options.

#### Parameters

- `options`: An object containing the linting configuration options
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
  - `fix?: boolean` - Opt into additional AI fixes after built-in ESLint fixes; incompatible with `fixType`
  - `fixDryRun?: boolean` - Whether to run autofix without saving the changes
  - `fixType?: string` - Comma-separated ESLint fix categories: `directive`, `problem`, `suggestion`, `layout`; incompatible with `check` or explicit `fix`
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
  - `rule?: string` - ESLint rule configuration override expression, preserved in the post-AI check; does not restrict fixes to these rules
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

## Usage

```bash
lex lint [options]
```

## Options

| Option | Description |
| --- | --- |
| --fix | Automatically fix problems (includes AI-powered fixes if configured) |
| --check | Report original source diagnostics without fixing; incompatible with --fixType |
| --fixDryRun | Apply built-in fixes in memory without saving source changes |
| --fixType <types> | Comma-separated directive, problem, suggestion, layout categories for built-in fixes; incompatible with --check or --fix |
| --config | Use this configuration, overriding .eslintrc.* config options if present |
| --debug | Output debugging information |
| --env | Specify environments |
| --envInfo | Output execution environment information |
| --global | Define global variables |
| --ignorePath | Specify path of ignore file |
| --ignorePattern | Pattern of files to ignore |
| --init | Run config initialization wizard |
| --noEslintrc | Disable use of legacy configuration lookup |
| --parser | Specify the parser to be used |
| --parserOptions | Specify parser options |
| --resolvePluginsRelativeTo | A folder where plugins should be resolved from |
| --rule <expression> | Override ESLint rule configuration; does not select which rules may fix code |
| --quiet | Report errors only |
| -h, --help | Display help for command |

## Examples

```bash
# Lint with automatic fixes (including AI-powered fixes if configured)
lex lint --fix

# Lint with a specific configuration
lex lint --config my-config.js

# Lint with quiet mode (only report errors)
lex lint --quiet

# Apply only built-in layout fixes; no AI is enabled
lex lint --fixType layout

# Preview layout and suggestion fixes without saving changes
lex lint --fixDryRun --fixType layout,suggestion

# Check original bytes with one rule configuration overridden
lex lint --check --rule 'semi: [error, always]'

# Lint with cache enabled
lex lint --cache
```

## AI-Powered Fixes

When using the `--fix` flag, Lex will:
1. Apply ESLint's built-in fixes
2. If there are remaining errors and AI is configured, use AI to fix them

To enable AI-powered fixes, add AI configuration to your `lex.config.js` file:

```javascript
export default {
  // Your existing config
  ai: {
    provider: 'cursor' // or 'openai', 'anthropic', etc.
  }
};
```

For more details on AI-powered linting, see the [Linting with AI documentation](../ai/ai.docs.md).

## Nonmutating lint checks

Use `lex lint --fixDryRun --config ./scoped-eslint.config.mjs --maxWarnings 0` to apply ESLint fixes in memory while preserving project source and configuration files. An existing explicit configuration takes priority over the project default; a missing explicit path warns and uses the existing fallback policy. The warning limit applies to the combined JavaScript and TypeScript files, including the final check after AI fixes.

Dry-run rejects `--fix` and `--remove-comments` because those request additional writes. It also skips TypeScript configuration generation and legacy configuration deletion. Generated temporary configuration files have unique names and are cleaned on completion or failure; existing caller-owned temporary files remain unchanged. Ordinary lint retains its historical built-in autofix, and `--fix` still enables additional AI fixes.

## Original source verification

Use `lex lint --check --config ./scoped-eslint.config.mjs --maxWarnings 0` for diagnostics against original source bytes. Unlike `--fixDryRun`, this reports fixable violations without applying fixes in memory. Check rejects fixing, dry-run fixing and comment removal and skips TypeScript config generation and legacy config deletion. Use an existing explicit config for a workflow without generated temporary configs; executable user config remains caller code. Patterns remain `src/**/*.{js,jsx}` and, with tsconfig.json, `src/**/*.{ts,tsx}`; limit scope through the supplied ESLint config. Stdin flags are still unsupported by the implementation.

Check and dry-run select a fresh, uncreated cache location with caching disabled, preserving caller-owned `.eslintcache`; ESLint otherwise deletes its existing default cache even during nonfixing checks.

## Fix categories and rule overrides

`fixType` and `rule` remain optional strings, passed as individual ESLint arguments without shell evaluation. ESLint validates their values. Default lint still applies built-in fixes without requiring `--fix`; `--fixType` limits those fixes by ESLint rule metadata, including `directive` fixes for unused disable directives. It also works with `--fixDryRun`. Category metadata is broader than a whitespace-only or token-preserving cleanup policy.

`--check --fixType` is rejected before configuration or subprocess work because ESLint requires fixing for category filtering. Explicit `--fix --fixType` is also rejected: AI edits do not enforce ESLint fix categories. Category filtering alone never opts into AI.

`--rule` is a configuration override, not a rule-selective fixer. Other configured rules and their fixes remain active. The override applies in default, dry-run and check modes and in the final nonfixing check after explicitly requested AI fixes. That final check never receives a fix category.
