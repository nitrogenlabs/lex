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

# Lex Linting with AI

The Lex linting system combines ESLint's built-in fixing capabilities with AI-powered fixes for more complex issues.

## Features

- **Standard ESLint Fixes**: Automatically applies ESLint's built-in fixes
- **AI-Powered Fixes**: Uses AI to fix issues that ESLint can't fix automatically
- **Seamless Integration**: No need for separate commands - just use `--fix` flag

## Usage

```bash
# Run linting with automatic fixes (including AI fixes if configured)
lex lint --fix

# Run linting without fixes
lex lint
```

## Configuration

To enable AI-powered fixes, add AI configuration to your `lex.config.js` file:

```javascript
export default {
  // Your existing config
  ai: {
    provider: 'cursor', // Use Cursor IDE for AI-powered fixes
    // Alternatively, you can use:
    // provider: 'openai',
    // apiKey: process.env.OPENAI_API_KEY,
    // model: 'gpt-4-turbo',
    
    // Or:
    // provider: 'anthropic',
    // apiKey: process.env.ANTHROPIC_API_KEY,
    // model: 'claude-3-opus-20240229',
  }
};
```

## How It Works

1. When you run `lex lint --fix`, ESLint first applies its built-in fixes
2. If there are remaining errors and AI is configured, Lex will:
   - Parse the ESLint output to identify files with errors
   - Apply direct fixes for common issues
   - Use AI (Cursor, OpenAI, or Anthropic) to fix more complex issues
3. ESLint runs again to verify that all issues are fixed

## Supported AI Providers

- **Cursor**: Uses Cursor IDE's built-in AI capabilities (recommended)
- **OpenAI**: Uses OpenAI's API (requires API key)
- **Anthropic**: Uses Anthropic's API (requires API key)

## Best Practices

- Configure AI in your project's `lex.config.js` file
- Use Cursor IDE for the best experience with AI-powered fixes
- Run `lex lint --fix` regularly to keep your code clean 