# Lex: The Ultimate React Development CLI

<p align="center">
  <img src="docs/assets/lex-logo.png" alt="Lex logo" width="520">
</p>

> **Zero Configuration. Maximum Productivity.**

Lex is the all-in-one development CLI that eliminates the complexity of modern React development. No more juggling bundler configs, testing setups, or build tools. Just install Lex globally and focus on what matters most - building amazing applications.

[![npm version](https://img.shields.io/npm/v/@nlabs/lex.svg?style=flat-square)](https://www.npmjs.com/package/@nlabs/lex)
[![npm downloads](https://img.shields.io/npm/dm/@nlabs/lex.svg?style=flat-square)](https://www.npmjs.com/package/@nlabs/lex)
[![Issues](https://img.shields.io/github/issues/nitrogenlabs/lex.svg?style=flat-square)](https://github.com/nitrogenlabs/lex/issues)
[![MIT license](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)
[![Chat](https://img.shields.io/discord/446122412715802649.svg)](https://discord.gg/nitrogenlabs)

## Why Lex?

### **Zero Configuration**

- Provides conventions and defaults for React 19 projects
- Vite-powered web builds with no required bundler config
- No testing setup to configure
- No build tools to manage

### **Lightning Fast**

- SWC-powered TypeScript and JavaScript compilation
- Fast Vite development server
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

Lex 2 requires Node.js 22 or newer.

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

| Tool | Purpose |
|------|---------|
| **SWC** | TypeScript/JavaScript compilation and Vite source transforms |
| **Vitest** | Unit and integration testing |
| **Playwright** | End-to-end testing |
| **TypeScript** | Type checking and declarations |
| **Vite** | Web development and production bundling |
| **Storybook** | React component development with Vite |
| **PostCSS and Tailwind CSS 4** | CSS processing |
| **ESLint** | Code linting |

## Commands Overview

### **Project Setup**

| Command | Description | Quick Example |
|---------|-------------|---------------|
| [`lex init`](src/commands/init/init.docs.md) | Create new React applications | `lex init my-app --typescript` |
| [`lex create`](src/commands/create/create.docs.md) | Generate project assets | `lex create view --outputName Dashboard` |
| [`lex migrate`](src/commands/migrate/migrate.docs.md) | Remove conflicting toolchain packages and reinstall | `lex migrate` |

### **Development**

| Command | Description | Quick Example |
|---------|-------------|---------------|
| [`lex dev`](src/commands/dev/dev.docs.md) | Start the Vite development server | `lex dev --open` |
| [`lex serverless-dev`](src/commands/serverless-dev/serverless-dev.docs.md) | Start the local Lambda server | `lex serverless-dev --host 0.0.0.0` |
| [`lex serverless-deploy`](src/commands/serverless-deploy/serverless-deploy.docs.md) | Bundle and package a Lambda function | `lex serverless-deploy --entry src/handler.ts` |
| [`lex compile`](src/commands/compile/compile.docs.md) | Compile TypeScript/JavaScript with SWC | `lex compile --watch` |
| [`lex build`](src/commands/build/build.docs.md) | Build with Vite or SWC | `lex build --mode production` |

### **Testing & Quality**

| Command | Description | Quick Example |
|---------|-------------|---------------|
| [`lex test`](src/commands/test/test.docs.md) | Run Vitest and Playwright tests | `lex test --unit` |
| [`lex lint`](src/commands/lint/lint.docs.md) | Lint code with ESLint | `lex lint --fix` |
| [`lex storybook`](src/commands/storybook/storybook.docs.md) | Start Storybook with React Vite defaults | `lex storybook --open` |

### **AI-Powered Features**

| Command | Description | Quick Example |
|---------|-------------|---------------|
| [`lex ai`](src/commands/ai/ai.docs.md) | AI code assistance | `lex ai --task generate --prompt "Create a button component"` |
| [`lex test`](src/commands/test/test.docs.md) | AI test generation | `lex test --generate` |
| [`lex build`](src/commands/build/build.docs.md) | AI build assistance | `lex build --assist` |

### **Package Management**

| Command | Description | Quick Example |
|---------|-------------|---------------|
| [`lex update`](src/commands/update/update.docs.md) | Update dependencies | `lex update --interactive` |
| [`lex upgrade`](src/commands/upgrade/upgrade.docs.md) | Upgrade Lex itself | `lex upgrade` |
| [`lex publish`](src/commands/publish/publish.docs.md) | Publish to npm | `lex publish --bump minor` |

### **Utilities**

| Command | Description | Quick Example |
|---------|-------------|---------------|
| [`lex clean`](src/commands/clean/clean.docs.md) | Clean project files | `lex clean` |
| [`lex config`](src/commands/config/config.docs.md) | Show resolved configurations | `lex config vite` |
| [`lex versions`](src/commands/versions/versions.docs.md) | Show tool versions | `lex versions` |
| [`lex linked`](src/commands/link/link.docs.md) | Check linked modules | `lex linked` |

## Core Features

### **Development Server**

```bash
# Start the Vite development server
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

# Force the SWC pipeline instead of the web default
lex build --bundler swc

# With AI optimization analysis
lex build --analyze
```

### **Testing Suite**

```bash
# Run all tests
lex test

# Watch mode
lex test --watch src

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
- **Setup Discovery**: Uses `vitest.setup.js` or a path supplied with `--setup` when present
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
lex ai --task explain --prompt "Explain this TypeScript error and suggest a fix"
```

## Framework Support

Lex's built-in web pipeline targets React 19 with Vite and Tailwind CSS 4. Lex also provides SWC compilation for Node, Lambda, and mobile targets; Vitest and Playwright test workflows; React Vite Storybook defaults; and local AWS Lambda HTTP, WebSocket, and GraphQL development.

## 🚀 Performance

Lex is designed for speed and efficiency:

- **Vite Development** - On-demand module transformation during development
- **SWC Compilation** - Fast non-web compilation and source transformation
- **Tree Shaking** - Automatic dead code elimination
- **Code Splitting** - Native dynamic-import chunks for web production builds

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
    model: 'gpt-4o'
  },

  // SWC configuration (defaults to ESM format)
  // SWC is the default compiler for non-web targets
  reactCompiler: true,

  // Vite configuration for web development and production builds
  vite: {
    staticPath: './src/static'
  },

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
| `outputHash` | `boolean` | Production mode | Add hashes to output filenames | `outputHash: true` |
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
| `ai.model` | `string` | `'gpt-4o'` | Model identifier passed to the provider | `ai: { model: 'gpt-4o' }` |
| `ai.provider` | `'cursor' \| 'copilot' \| 'openai' \| 'anthropic' \| 'none'` | `'none'` | AI service provider | `ai: { provider: 'openai' }` |
| `ai.temperature` | `number` | `0.1` | AI response creativity (0-1) | `ai: { temperature: 0.7 }` |

### **SWC Configuration**

SWC (Speedy Web Compiler) powers non-web compilation and Lex's source transformation inside Vite. SWC provides:

- **Fast native compilation** for TypeScript and JavaScript
- **Zero configuration** - works out of the box
- **ESM by default** - modern module format
- **Automatic React JSX** transformation
- **TypeScript decorators** support

SWC is automatically configured and doesn't require additional configuration in most cases. The default settings provide optimal performance and compatibility.

| Feature | Description | Default |
|---------|-------------|---------|
| **Output Format** | JavaScript module format | `esm` |
| **Target** | JavaScript target version | `es2023` |
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

Vite is the default for `web` projects. Lex merges the `vite` object with its required plugin stack, so standard Vite options such as `base`, `server`, and `resolve` can be supplied alongside Lex's `staticPath` option. Project plugins are appended to Lex's built-in plugins.

| Option | Type | Default | Description | Example |
|--------|------|---------|-------------|---------|
| `vite.staticPath` | `string` | `'./src/static'` | Static assets copied to the output root | `vite: { staticPath: './assets' }` |
| `vite.*` | `Vite UserConfig` | `undefined` | Additional Vite configuration merged with Lex defaults | `vite: { base: '/app/' }` |

Web builds provide dynamic-import code splitting, GraphQL document loading, PostCSS, source maps, and browser shims for `assert`, `buffer`, `http`, `https`, `os`, `path`, `process`, `stream`, `util`, and `vm`. `crypto` remains an empty browser shim, matching the previous Lex behavior.

Lex also processes these conventional asset locations:

| Source | Output | Behavior |
|--------|--------|----------|
| `vite.staticPath` | Output root | Recursively copied |
| `<sourcePath>/images` | `images` | Copied and optimized |
| `<sourcePath>/fonts` | `fonts` | Copied |
| `<sourcePath>/docs` | `docs` | Copied |
| `<sourcePath>/icons/*.svg` | `icons/icons.svg` | Combined into an optimized SVG sprite |
| `<sourcePath>/images/logo.png` | Output root | Generates favicons, manifests, `open-graph.png`, and `twitter.png` |

Production builds optimize GIF, JPEG, PNG, SVG, and WebP assets. Compressible CSS, HTML, JavaScript, JSON, SVG, text, and XML files of at least 8 KiB receive a `.gz` sidecar.

### **Migrating from Lex 1.x**

Lex 2 is a breaking migration from Webpack to Vite for web projects. Non-web projects use SWC.

Update the configuration property:

```javascript
const lex1Config = {
  webpack: {
    staticPath: './src/static'
  }
};

const lex2Config = {
  vite: {
    staticPath: './src/static'
  }
};
```

- Remove project references to Lex's former `webpack.config.js` and Webpack-specific Lex options.
- Use `lex build --bundler vite` for an explicit web build or rely on the `web` preset default.
- Use `lex build --bundler swc` for Node, Lambda, mobile, and library compilation when needed.
- Keep native `import()` expressions; Vite creates dynamic chunks without additional configuration.
- Put pass-through public files in `vite.staticPath`. The image, font, document, icon, favicon, optimization, and gzip behavior described above is built in.
- Use `lex config vite` to inspect the resolved Vite configuration.

### **Library Configuration**

| Option | Type | Default | Description | Example |
|--------|------|---------|-------------|---------|
| `libraryName` | `string` | `undefined` | Library name for UMD builds | `libraryName: 'MyLibrary'` |
| `libraryTarget` | `string` | `undefined` | Library target format | `libraryTarget: 'umd'` |

### **File Management**

| Option | Type | Default | Description | Example |
|--------|------|---------|-------------|---------|
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
    model: 'gpt-4o',
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

**Solution**: Put pass-through files in `vite.staticPath` (default: `src/static`) or use the conventional `images`, `fonts`, `docs`, and `icons` directories under `sourcePath`. Vite serves these source assets directly during development.

#### Port Already in Use

If you get an "address already in use" error, another process is using the default port (3000).

**Solution**: Kill the existing process or use a different port:

```bash
# Kill processes on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
lex dev --port 3001
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

If an asset referenced by HTML is missing, verify its source location. Files in `vite.staticPath` are served from `/`, while conventional directories retain their output prefix—for example, `<sourcePath>/images/banner.png` becomes `/images/banner.png`. Add `<sourcePath>/images/logo.png` when Lex should generate favicon and social-image assets automatically.

## Documentation

- **[Vite build](src/commands/build/build.docs.md)** and **[development server](src/commands/dev/dev.docs.md)**
- **[Configuration](src/commands/config/config.docs.md)**
- **[Testing](src/commands/test/test.docs.md)** and **[linting](src/commands/lint/lint.docs.md)**
- **[Storybook](src/commands/storybook/README.md)**
- **[Serverless development](src/commands/serverless-dev/serverless-dev.docs.md)** and **[deployment](src/commands/serverless-deploy/serverless-deploy.docs.md)**
- **[AI commands](src/commands/ai/ai.docs.md)**

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
