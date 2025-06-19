# Lex Lint Command

The Lex lint command helps lint your code using ESLint with the `eslint-config-styleguidejs` configuration.

## Usage

```bash
lex lint
```

This will lint all JavaScript files in your project's `src` directory. If your project uses TypeScript (set via `useTypescript: true` in `lex.config.js`), it will also lint TypeScript files.

## Options

- `--fix`: Automatically fix problems when possible
- `--config <path>`: Use a custom ESLint configuration file
- `--cache`: Only check changed files
- `--quiet`: No notifications printed in the console
- `--debug`: Show debug information

## Configuration

The lint command will automatically detect if your project uses TypeScript by checking the `useTypescript` setting in your `lex.config.js` file. If TypeScript is enabled, it will lint both JavaScript and TypeScript files.

## Requirements

Your project must have ESLint installed. If you don't have ESLint set up, the command will create a temporary configuration file for you.

## Examples

```bash
# Lint files and automatically fix problems
lex lint --fix

# Use a custom ESLint config
lex lint --config ./path/to/eslint.config.js

# Lint with cache enabled
lex lint --cache
``` 