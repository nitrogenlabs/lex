# Lex: The Ultimate React Development CLI

<p align="center">
  <img src="docs/assets/lex-logo.png" alt="Lex logo" width="520">
</p>

> **Zero Configuration. Maximum Productivity.**

Lex is the all-in-one development CLI that eliminates the complexity of modern React development. No more juggling bundler configs, testing setups, or build tools. Just install Lex globally and focus on what matters most - building amazing applications.

[![npm version](https://img.shields.io/npm/v/@nlabs/lex.svg?style=flat-square)](https://www.npmjs.com/package/@nlabs/lex)
[![npm downloads](https://img.shields.io/npm/dm/@nlabs/lex.svg?style=flat-square)](https://www.npmjs.com/package/@nlabs/lex)
[![Issues](http://img.shields.io/github/issues/nitrogenlabs/lex.svg?style=flat-square)](https://github.com/nitrogenlabs/lex/issues)
[![TypeScript](https://badges.frapsoft.com/typescript/version/typescript-next.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)
[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](http://opensource.org/licenses/MIT)
[![Chat](https://img.shields.io/discord/446122412715802649.svg)](https://discord.gg/nitrogenlabs)

## Why Lex?

### **Zero Configuration**

- Works out of the box with any React project
- Vite-powered web builds with no required bundler config
- No testing setup to configure
- No build tools to manage

### **Lightning Fast**

- SWC-powered compilation (10-100x faster than Babel)
- Hot reloading development server
- Optimized production builds
- Parallel test execution

### **AI-Powered Development**

- AI-assisted error fixing
- Intelligent test generation
- Code optimization suggestions
- Smart linting with auto-fix

### **Enterprise Ready**

- TypeScript support out of the box
- Vitest testing framework included
- Storybook integration
- Production-optimized builds

## Quick Start

```bash
# Install Lex globally
npm install -g @nlabs/lex

# Create a new React app
lex init my-awesome-app --typescript --install

# Navigate to your app
cd my-awesome-app

# Start development server
lex dev --open

# Run tests
lex test

# Build for production
lex build --mode production
```

## What's Included

Lex comes with everything you need for modern React development:

| Tool | Purpose | Version |
|------|---------|---------|
| **SWC** | Lightning-fast TypeScript/JavaScript compiler | Latest |
| **Vitest** | Testing framework | Latest |
| **TypeScript** | Type safety | Latest |
| **Vite** | Web development and production bundling | Latest |
| **Storybook** | Component development | Latest |
| **PostCSS** | CSS processing | Latest |
| **ESLint** | Code linting | Latest |

## Commands Overview

### **Project Setup**

| Command | Description | Quick Example |
|---------|-------------|---------------|
| [`lex init`](#init) | Create new React applications | `lex init my-app --typescript` |
| [`lex create`](#create) | Generate project assets | `lex create view Dashboard` |
| [`lex migrate`](#migrate) | Migrate existing projects | `lex migrate` |

### **Development**

| Command | Description | Quick Example |
|---------|-------------|---------------|
| [`lex dev`](#dev) | Start development server | `lex dev --open` |
| [`lex serverless-dev`](#serverless-dev) | Start serverless development server | `lex serverless-dev --host 0.0.0.0` |
| [`lex compile`](#compile) | Compile TypeScript/JavaScript | `lex compile --watch` |
| [`lex build`](#build) | Build for production | `lex build --mode production` |

### **Testing & Quality**

| Command | Description | Quick Example |
|---------|-------------|---------------|
| [`lex test`](#test) | Run Vitest tests | `lex test --watch` |
| [`lex lint`](#lint) | Lint code with ESLint | `lex lint --fix` |
| [`lex storybook`](#storybook) | Start Storybook | `lex storybook --open` |

### **AI-Powered Features**

| Command | Description | Quick Example |
|---------|-------------|---------------|
| [`lex ai`](#ai) | AI code assistance | `lex ai --task generate --prompt "Create a button component"` |
| [`lex test`](#test) | AI test generation | `lex test --generate` |
| [`lex build`](#build) | AI error fixing | `lex build --assist` |

### **Package Management**

| Command | Description | Quick Example |
|---------|-------------|---------------|
| [`lex update`](#update) | Update dependencies | `lex update --interactive` |
| [`lex upgrade`](#upgrade) | Upgrade Lex itself | `lex upgrade` |
| [`lex publish`](#publish) | Publish to npm | `lex publish --bump minor` |

### **Utilities**

| Command | Description | Quick Example |
|---------|-------------|---------------|
| [`lex clean`](#clean) | Clean project files | `lex clean` |
| [`lex copy`](#copy) | Copy files/directories | `lex copy src lib` |
| [`lex config`](#config) | Show configurations | `lex config vite` |
| [`lex versions`](#versions) | Show tool versions | `lex versions` |
| [`lex link`](#link) | Check linked modules | `lex link` |

## Core Features

### **Development Server**

```bash
# Start with hot reloading
lex dev --open

# With bundle analyzer
lex dev --bundleAnalyzer

# Force refresh cached public IP
lex dev --usePublicIp
```

Configure the default `lex dev` port in `lex.config.mjs`:

```javascript
export default {
  dev: {
    port: 4200
  }
};
```

`--port` takes precedence over `dev.port`.

**Public IP Caching**: Lex automatically caches your public IP address for 1 week to reduce API calls. Use `--usePublicIp` to force refresh the cache when needed.

**Static Assets**: If your HTML template references static assets with absolute paths, ensure they exist in the configured static directory.

Use `vite.staticPath` to specify the directory. Lex copies these files and optimizes supported images during production builds.

### **Serverless Development Server** {#serverless-dev}

```bash
# Start serverless development server
lex serverless-dev

# With custom host and ports
lex serverless-dev --host 0.0.0.0 --httpPort 4000 --wsPort 4002

# With environment variables
lex serverless-dev --variables '{"NODE_ENV":"development","API_KEY":"test"}'

# With GraphQL debug logging
lex serverless-dev --debug --printOutput
```

**AWS Lambda Simulation**: Lex provides a local development server similar to serverless-offline, allowing you to test AWS Lambda functions with HTTP and WebSocket support.

**Configuration**: Configure your serverless functions in `lex.config.mjs`. See the [Serverless Documentation](src/commands/serverless-dev/serverless-dev.docs.md) for detailed configuration options.

```javascript
export default {
  serverless: {
    custom: {
      'serverless-offline': {
        httpPort: 3100,
        httpsPort: 3101,
        wsPort: 3102
      }
    }
  }
};
```

`--httpPort`, `--httpsPort`, and `--wsPort` override these config values.

**Environment Variables**: The `serverless-dev` command automatically loads environment variables from `.env`, `.env.local`, and `.env.development` files, with command-line variables taking precedence.

### **Production Builds**

```bash
# Standard production build
lex build --mode production

# With SWC (faster)
lex build --bundler swc

# With AI optimization analysis
lex build --analyze
```

### **Testing Suite**

```bash
# Run all tests
lex test

# Watch mode
lex test --watch

# Generate tests with AI
lex test --generate

# Debug failing tests
lex test --debugTests

# Use project-specific Vitest config
lex test --config ./vitest.config.mjs
```

#### Advanced Testing Features

- **Smart Configuration Merging**: Automatically merges your project's Vitest config with Lex's optimized defaults
- **ESM Support**: Automatic detection and configuration for ES modules projects
- **Automatic Setup**: Creates vitest.setup.js file if one doesn't exist
- **React JSX Automatic Runtime**: No need to import React in your test files
- **TypeScript-First**: Optimized for TypeScript projects with specialized configs

### **Storybook Integration**

```bash
# Start Storybook
lex storybook --open

# With Tailwind CSS support
lex storybook --useLexConfig

# Build static site
lex storybook --static
```

### **AI-Powered Development**

```bash
# Generate code
lex ai --task generate --prompt "Create a user profile component"

# Explain code
lex ai --task explain --file src/components/Button.tsx

# Fix errors
lex ai --task help --prompt "Fix this TypeScript error"
```

## Framework Support

Lex works seamlessly with popular React frameworks and libraries:

- ✅ **Create React App** - Migrate existing CRA projects
- ✅ **Next.js** - Use Lex for testing and building
- ✅ **Gatsby** - Integrate Lex workflows
- ✅ **Vite** - Alternative to Vite for complex projects
- ✅ **TypeScript** - Full TypeScript support out of the box
- ✅ **Tailwind CSS** - Automatic Tailwind integration
- ✅ **Storybook** - Built-in Storybook support
- ✅ **Serverless** - Local AWS Lambda development with HTTP/WebSocket support

## 🚀 Performance

Lex is designed for speed and efficiency:

- **SWC Integration** - 10-100x faster than Babel, faster than esbuild
- **Smart Caching** - Intelligent caching for faster rebuilds
- **Hot Reloading** - Instant feedback during development
- **Tree Shaking** - Automatic dead code elimination
- **Code Splitting** - Automatic code splitting for optimal loading

## Configuration

Lex works out of the box, but you can customize it with a `lex.config.js` file:

```javascript
export default {
  // Project settings
  useTypescript: true,
  sourcePath: './src',
  outputPath: './lib',

  // Package manager
  packageManager: 'npm',

  // AI configuration
  ai: {
    provider: 'openai',
    model: 'gpt-4'
  },

  // SWC configuration (defaults to ESM format)
  // SWC is now the default transpiler for all compilation tasks
  reactCompiler: true,

  // Vitest configuration (merged with Lex defaults)
  vitest: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      reporter: ['html', 'text']
    }
  }
};
```

## Configuration Options Reference

Lex provides extensive configuration options through the `lex.config.js` file. Here's a comprehensive reference of all available options:

### **Project Settings**

| Option | Type | Default | Description | Example |
|--------|------|---------|-------------|---------|
| `entryHTML` | `string` | `'index.html'` | HTML template file | `entryHTML: 'app.html'` |
| `entryJs` | `string` | `'index.js'` | Main JavaScript entry file | `entryJs: 'main.tsx'` |
| `dev.port` | `number` | `3000` | Default port used by `lex dev` when `--port` is not passed | `dev: { port: 4200 }` |
| `outputFile` | `string` | `undefined` | Specific output filename | `outputFile: 'bundle.js'` |
| `outputFullPath` | `string` | `path.resolve('./lib')` | Absolute output path for build artifacts and static files. | `outputFullPath: '/absolute/build'` |
| `outputHash` | `boolean` | `false` | Add hash to output filenames | `outputHash: true` |
| `outputPath` | `string` | `'./lib'` | Output directory path | `outputPath: './build'` |
| `packageManager` | `'npm' \| 'yarn'` | `'npm'` | Package manager to use | `packageManager: 'yarn'` |
| `preset` | `'web' \| 'node' \| 'lambda' \| 'mobile'` | `'web'` | Project preset type | `preset: 'node'` |
| `reactCompiler` | `boolean \| object` | `false` | Enable React Compiler through SWC, optionally with compiler options | `reactCompiler: true` |
| `sourceFullPath` | `string` | `path.resolve('./src')` | Absolute source code path | `sourceFullPath: '/absolute/path'` |
| `sourcePath` | `string` | `'./src'` | Source code directory path | `sourcePath: './app'` |
| `targetEnvironment` | `'web' \| 'node'` | `'web'` | Target runtime environment | `targetEnvironment: 'node'` |
| `useGraphQl` | `boolean` | `false` | Enable GraphQL support | `useGraphQl: true` |
| `useTypescript` | `boolean` | `false` | Enable TypeScript support | `useTypescript: true` |

### **AI Configuration**

| Option | Type | Default | Description | Example |
|--------|------|---------|-------------|---------|
| `ai.apiKey` | `string` | `undefined` | API key for AI provider | `ai: { apiKey: 'sk-...' }` |
| `ai.maxTokens` | `number` | `4000` | Maximum tokens for AI responses | `ai: { maxTokens: 8000 }` |
| `ai.model` | `string` | `'gpt-4o'` | AI model to use | `ai: { model: 'gpt-4' }` |
| `ai.provider` | `'cursor' \| 'copilot' \| 'openai' \| 'anthropic' \| 'none'` | `'none'` | AI service provider | `ai: { provider: 'openai' }` |
| `ai.temperature` | `number` | `0.1` | AI response creativity (0-1) | `ai: { temperature: 0.7 }` |

### **SWC Configuration**

SWC (Speedy Web Compiler) is now the default transpiler for all TypeScript and JavaScript compilation in Lex. SWC provides:

- **10-100x faster** compilation than Babel
- **Faster than esbuild** for TypeScript compilation
- **Zero configuration** - works out of the box
- **ESM by default** - modern module format
- **Automatic React JSX** transformation
- **TypeScript decorators** support

SWC is automatically configured and doesn't require additional configuration in most cases. The default settings provide optimal performance and compatibility.

| Feature | Description | Default |
|---------|-------------|---------|
| **Output Format** | JavaScript module format | `esm` |
| **Target** | JavaScript target version | `es2020` |
| **JSX Runtime** | React JSX transformation | `automatic` |
| **React Compiler** | Optional React Compiler SWC plugin | `false` |
| **Decorators** | TypeScript decorators support | `enabled` |
| **Source Maps** | Debug information | `inline` |

Enable the React Compiler through Lex's SWC pipeline:

```javascript
export default {
  reactCompiler: true
};
```

You can also pass SWC React Compiler options:

```javascript
export default {
  reactCompiler: {
    compilationMode: 'infer',
    panicThreshold: 'none',
    target: '19'
  }
};
```

### **Vitest Configuration**

| Option | Type | Default | Description | Example |
|--------|------|---------|-------------|---------|
| `vitest.environment` | `string` | `undefined` | Test environment | `vitest: { environment: 'jsdom' }` |
| `vitest.setupFiles` | `string[]` | `undefined` | Setup files executed before tests | `vitest: { setupFiles: ['./src/setupTests.ts'] }` |
| `vitest.include` | `string[]` | `undefined` | Test file glob patterns | `vitest: { include: ['src/**/*.{test,spec}.ts'] }` |
| `vitest.exclude` | `string[]` | `undefined` | Exclude patterns for tests | `vitest: { exclude: ['dist'] }` |
| `vitest.coverage.reporter` | `string[]` | `undefined` | Coverage reporters | `vitest: { coverage: { reporter: ['text', 'html'] } }` |
| `vitest.coverage.reportsDirectory` | `string` | `undefined` | Coverage output directory | `vitest: { coverage: { reportsDirectory: 'coverage' } }` |

### **ESLint Configuration**

Lex provides a default ESLint configuration optimized for React and TypeScript projects. To extend Lex's ESLint config, create an `eslint.config.mjs` file in your project root that imports and spreads Lex's configuration.

**How it works:**
- Lex uses ESLint's flat config format (array-based configuration)
- Create an `eslint.config.mjs` file that imports `@nlabs/lex/eslint.config.mjs` and spreads it
- Add your custom rules as additional objects in the array
- If you don't create an `eslint.config.mjs`, Lex will use its default configuration automatically

**Recommended approach - Create `eslint.config.mjs`:**

```javascript
// eslint.config.mjs
import lexConfig from '@nlabs/lex/eslint.config.mjs';

export default [
  ...lexConfig,
  {
    rules: {
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': 'error'
    }
  }
];
```

**Alternative - Use `lex.config.*` (limited):**

You can also specify ESLint rules in your `lex.config.js` file, but this is less flexible:

| Option | Type | Default | Description | Example |
|--------|------|---------|-------------|---------|
| `eslint.extends` | `string[]` | `undefined` | Additional ESLint configs to extend | `eslint: { extends: ['@typescript-eslint/recommended'] }` |
| `eslint.rules` | `Linter.RulesRecord` | `undefined` | Custom ESLint rules | `eslint: { rules: { 'no-console': 'warn' } }` |

**Note:** Creating an `eslint.config.mjs` file gives you full control and is the recommended approach. The `lex.config.*` approach is provided for simple rule overrides only.

### **Vite Configuration**

| Option | Type | Default | Description | Example |
|--------|------|---------|-------------|---------|
| `vite.staticPath` | `string` | `'./src/static'` | Static assets copied to the output root | `vite: { staticPath: './assets' }` |
| `vite.*` | `Vite UserConfig` | `undefined` | Additional Vite configuration merged with Lex defaults | `vite: { base: '/app/' }` |

### **Library Configuration**

| Option | Type | Default | Description | Example |
|--------|------|---------|-------------|---------|
| `libraryName` | `string` | `undefined` | Library name for UMD builds | `libraryName: 'MyLibrary'` |
| `libraryTarget` | `string` | `undefined` | Library target format | `libraryTarget: 'umd'` |

### **File Management**

| Option | Type | Default | Description | Example |
|--------|------|---------|-------------|---------|
| `configFiles` | `string[]` | `[]` | Additional config files to include | `configFiles: ['./config/custom.js']` |
| `copyFiles` | `string[]` | `[]` | Files to copy during build | `copyFiles: ['public/assets']` |
| `env` | `object` | `null` | Environment variables | `env: { NODE_ENV: 'development' }` |
| `gitUrl` | `string` | `undefined` | Git repository URL | `gitUrl: 'https://github.com/user/repo'` |

### **Usage Examples**

#### Basic TypeScript Project

```javascript
export default {
  useTypescript: true,
  sourcePath: './src',
  outputPath: './lib',
  preset: 'web',
  targetEnvironment: 'web'
};
```

#### Node.js Library

```javascript
export default {
  useTypescript: true,
  preset: 'node',
  targetEnvironment: 'node',
  libraryName: 'MyLibrary',
  libraryTarget: 'umd'
  // SWC automatically handles Node.js compilation with optimal settings
};
```

#### AI-Powered Development

```javascript
export default {
  useTypescript: true,
  ai: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
    maxTokens: 8000,
    temperature: 0.3
  },
  vitest: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts']
  }
};
```

#### Advanced SWC Configuration

```javascript
export default {
  useTypescript: true
  // SWC provides optimal defaults for all compilation tasks
  // No additional configuration needed for most use cases
  // SWC automatically handles:
  // - ESM output format (default)
  // - ES2020 target
  // - React JSX transformation
  // - TypeScript decorators
  // - Source map generation
};
```

#### Custom ESLint Configuration

**Option 1: Create `eslint.config.mjs` (Recommended)**

```javascript
// eslint.config.mjs
import lexConfig from '@nlabs/lex/eslint.config.mjs';

export default [
  ...lexConfig,
  {
    rules: {
      'no-console': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'react/prop-types': 'off' // Not needed with TypeScript
    }
  }
];
```

**Option 2: Use `lex.config.*` (Simple overrides only)**

```javascript
// lex.config.js
export default {
  useTypescript: true,
  eslint: {
    rules: {
      'no-console': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off'
    }
  }
};
```

## Troubleshooting

### Common Issues

#### 404 Error with "Static Paths" Message

If static assets return 404, verify that `vite.staticPath` exists and points to the intended directory.

**Solution**: The `outputFullPath` directory should exist before starting the dev server. You can:

- Run `lex build` first to create the output directory
- Or ensure your `outputPath` configuration points to an existing directory

#### Port Already in Use

If you get an "address already in use" error, another process is using the default port (3000).

**Solution**: Kill the existing process or use a different port:

```bash
# Kill processes on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
lex dev --port 3000
```

#### TypeScript Configuration Issues

If TypeScript compilation fails, ensure your `tsconfig.json` is properly configured.

**Solution**: Check that your `tsconfig.json` includes the correct paths:

```json
{
  "compilerOptions": {
    "outDir": "./lib",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "lib"]
}
```

#### Missing Static Assets Error

If you see build errors about missing static assets, check that every path referenced by the HTML template exists.

**Solution**: Either create the missing files or update your HTML template to use relative paths:

```html
<!-- Instead of absolute paths -->
<link rel="icon" href="/favicon.ico" />
<link rel="manifest" href="/manifest.json" />

<!-- Use relative paths -->
<link rel="icon" href="favicon.ico" />
<link rel="manifest" href="manifest.json" />
```

Or create the missing files in your source directory:

```bash
touch src/favicon.ico
touch src/manifest.json
mkdir -p src/images && touch src/images/logo-icon-64.png
```

## Documentation

- 📖 **[Full Documentation](http://lex.nitrogenlabs.com)** - Complete API reference
- 🎯 **[Getting Started Guide](http://lex.nitrogenlabs.com/getting-started)** - Step-by-step tutorial
- 🛠️ **[Configuration Guide](http://lex.nitrogenlabs.com/configuration)** - Customization options
- 🤖 **[AI Features Guide](http://lex.nitrogenlabs.com/ai-features)** - AI-powered development
- 🧪 **[Testing Guide](http://lex.nitrogenlabs.com/testing)** - Testing best practices

## Contributing

We love contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/nitrogenlabs/lex.git

# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **SWC** - For lightning-fast TypeScript/JavaScript compilation
- **Vitest** - For comprehensive testing
- **TypeScript** - For type safety
- **Vite** - For fast web development and production bundling
- **Storybook** - For component development
- **OpenAI/Anthropic** - For AI-powered features

## Support

- **Issues** - [GitHub Issues](https://github.com/nitrogenlabs/lex/issues)
- **Discussions** - [GitHub Discussions](https://github.com/nitrogenlabs/lex/discussions)
- **Email** - <support@nitrogenlabs.com>
- **Twitter** - [@NitrogenLabs](https://twitter.com/NitrogenLabs)

---

**Made with ❤️ by [Nitrogen Labs](https://nitrogenlabs.com)**

*Lex - Because development should be effortless.*
