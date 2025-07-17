# Storybook Command

The Storybook command in Lex provides a convenient way to start Storybook development servers or build static Storybook sites with enhanced features like automatic Tailwind CSS integration and flexible configuration management.

## Features

- **Automatic Story Detection**: Finds story files using common patterns
- **Framework Support**: Works with React, Vue, Angular, Web Components, and generic Storybook
- **Development & Static Modes**: Start dev server or build static site
- **Custom Configuration**: Support for custom Storybook config directories
- **Lex Configuration**: Use Lex's built-in Storybook configuration to avoid conflicts
- **Environment Variables**: Set custom environment variables
- **Port Configuration**: Specify custom ports for the development server (defaults to 6007)
- **Tailwind CSS Integration**: Automatic detection and integration of Tailwind CSS files
- **Progress Tracking**: Real-time build progress with percentage updates
- **Output Filtering**: Intelligent filtering and beautification of Storybook output
- **Verbose Mode**: Detailed output for debugging and troubleshooting

## Installation

The Storybook command is included with Lex and includes Storybook v9 core packages. Make sure you have Storybook installed in your project:

```bash
# For React (recommended)
npm install --save-dev @storybook/react @storybook/react-webpack5

# For Vue
npm install --save-dev @storybook/vue @storybook/vue-webpack5

# For Angular
npm install --save-dev @storybook/angular @storybook/angular-webpack5

# For Web Components
npm install --save-dev @storybook/web-components @storybook/web-components-webpack5

# Generic Storybook
npm install --save-dev storybook
```

## Included Dependencies

Lex includes the following Storybook v9 packages:

### Core Packages

- `@storybook/cli` - Storybook CLI tools
- `@storybook/react` - React framework support
- `@storybook/react-webpack5` - Webpack 5 builder for React
- `storybook` - Main Storybook package

### Peer Dependencies

These packages should be installed in your project:

- `@storybook/react` - React framework support
- `@storybook/react-webpack5` - Webpack 5 builder for React
- `storybook` - Main Storybook package

## Usage

### Basic Usage

Start Storybook development server:

```bash
lex storybook
```

### Command Options

```bash
lex storybook [options]
```

**Options:**

- `--config <path>` - Custom Storybook configuration directory path (ie. .storybook)
- `--lexConfig <path>` - Custom Lex configuration file path (ie. lex.config.js)
- `--open` - Automatically open Storybook in a new browser window
- `--port <number>` - Port number for the Storybook server (defaults to 6007)
- `--quiet` - No Lex notifications printed in the console
- `--static` - Build a static Storybook site instead of starting dev server
- `--useLexConfig` - Use Lex's built-in Storybook configuration instead of project config
- `--variables <n>` - Environment variables to set in "process.env" (ie. "{STORYBOOK_THEME: 'dark'}")
- `--verbose` - Show verbose output including webpack progress details

### Examples

#### Start Development Server

```bash
# Basic start
lex storybook

# With auto-open browser
lex storybook --open

# With custom port
lex storybook --port 6007

# With custom configuration
lex storybook --config ./custom-storybook

# Use Lex's configuration (recommended to avoid conflicts)
lex storybook --useLexConfig
```

#### Build Static Site

```bash
# Build static site
lex storybook --static

# Build with custom output directory (configured in Storybook)
lex storybook --static --config ./custom-storybook
```

#### With Environment Variables

```bash
# Set custom environment variables
lex storybook --variables '{"STORYBOOK_THEME": "dark", "DEBUG": true}'
```

#### Quiet Mode

```bash
# Run without Lex notifications
lex storybook --quiet
```

#### Verbose Mode

```bash
# Show detailed output for debugging
lex storybook --verbose
```

## Story File Detection

The command automatically finds story files using these patterns:

- `**/*.stories.{ts,tsx,js,jsx}` - Files ending with `.stories.ts`, `.stories.tsx`, `.stories.js`, or `.stories.jsx`
- `**/*.story.{ts,tsx,js,jsx}` - Files ending with `.story.ts`, `.story.tsx`, `.story.js`, or `.story.jsx`
- `**/stories/**/*.{ts,tsx,js,jsx}` - Any TypeScript or JavaScript files in a `stories/` directory

## Tailwind CSS Integration

The command automatically detects and integrates Tailwind CSS:

- **Automatic Detection**: Searches for `tailwind.css` files using the pattern `**/tailwind.css`
- **Nested Support**: Works with Tailwind CSS files in nested directories
- **Environment Variables**: Passes the detected path to Storybook via `TAILWIND_CSS_PATH`
- **Status Feedback**: Shows whether Tailwind CSS was detected and its location

### Tailwind CSS Setup

Create a `tailwind.css` file in your project with the standard Tailwind directives:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

The command will automatically detect this file and integrate it with Storybook.

## Configuration Management

### Using Lex's Configuration (Recommended)

To avoid loader conflicts and ensure consistent setup, use Lex's built-in configuration:

```bash
lex storybook --useLexConfig
```

This approach:

- Uses Lex's pre-configured webpack and PostCSS setup
- Avoids conflicts between project and Lex's loaders
- Ensures consistent Tailwind CSS integration
- Provides a clean, isolated configuration

### Using Project Configuration

If you have a custom Storybook configuration:

```bash
lex storybook --config ./custom-storybook
```

### Configuration Priority

The command follows this priority order:

1. **Custom config path** (if `--config` is provided)
2. **Lex config** (if `--useLexConfig` is set)
3. **Project config** (if `.storybook` exists in project root)
4. **Lex config** (as fallback)

## Supported Frameworks

The command supports all major Storybook frameworks:

- **React**: `@storybook/react` + `@storybook/react-webpack5`
- **Vue**: `@storybook/vue` + `@storybook/vue-webpack5`
- **Angular**: `@storybook/angular` + `@storybook/angular-webpack5`
- **Web Components**: `@storybook/web-components` + `@storybook/web-components-webpack5`
- **Generic**: `storybook`

## Error Handling

The command provides helpful error messages for common issues:

- **Storybook not installed**: Suggests installing the appropriate Storybook package
- **No story files found**: Provides guidance on creating story files
- **Binary not found**: Suggests reinstalling Lex or checking Storybook installation
- **Invalid environment variables**: Validates JSON format for environment variables
- **Configuration not found**: Provides guidance on Storybook initialization
- **Tailwind CSS not found**: Suggests creating a tailwind.css file with proper directives

## Programmatic Usage

You can also use the Storybook command programmatically:

```typescript
import { storybook } from '@nlabs/lex';

// Start development server
await storybook({
  open: true,
  port: 6007,
  quiet: false
});

// Build static site
await storybook({
  static: true,
  quiet: false
});

// Use Lex's configuration
await storybook({
  useLexConfig: true,
  quiet: false
});

// With custom configuration
await storybook({
  config: './.storybook',
  variables: '{"STORYBOOK_THEME": "dark"}',
  quiet: false
});

// With verbose output
await storybook({
  verbose: true,
  quiet: false
});
```

## Integration with Lex Config

The Storybook command respects Lex configuration files and can be customized through `lex.config.js`:

```javascript
// lex.config.js
module.exports = {
  // Your Lex configuration
  useTypescript: true,

  // Storybook-specific configuration can be added here
  storybook: {
    defaultPort: 6007,
    defaultConfig: './.storybook'
  }
};
```

## Troubleshooting

### Storybook Not Found

If you get an error that Storybook is not installed:

```bash
# Install the appropriate Storybook package for your framework
npm install --save-dev @storybook/react @storybook/react-webpack5
```

### No Story Files Found

If no story files are detected:

1. Make sure your story files follow the naming conventions
2. Check that files are not in ignored directories (node_modules, dist, build)
3. Create story files with `.stories.ts` or `.stories.js` extensions

### Port Already in Use

If the default port is already in use:

```bash
# Use a different port
lex storybook --port 6008
```

### Loader Conflicts

If you encounter loader conflicts between project and Lex's dependencies:

```bash
# Use Lex's configuration to avoid conflicts
lex storybook --useLexConfig
```

### Tailwind CSS Not Working

If Tailwind CSS is not being applied:

1. Ensure you have a `tailwind.css` file with proper directives
2. Check that the file is in a location that matches the `**/tailwind.css` pattern
3. Use `--verbose` to see detailed output and debug the issue

### Custom Configuration Issues

If you have a custom Storybook configuration:

```bash
# Specify the custom config directory
lex storybook --config ./custom-storybook
```

## Version Compatibility

This command is designed to work with Storybook v9. If you need to use older versions of Storybook, you may need to install the appropriate packages manually in your project.
