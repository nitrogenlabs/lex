# Migrating from Lex 1 to Lex 2

Lex 2 replaces Webpack with Vite for web development and production builds. It is a major-version upgrade: Webpack configuration is not read, and Lex does not provide a compatibility layer for it. Node, Lambda, and mobile projects use SWC by default.

This guide assumes a project is upgrading from the latest Lex 1 release. If the project uses an older Lex 1 release, update to the latest v1 release and establish a passing build before starting the v2 migration.

## What changes

| Area | Lex 1 | Lex 2 | Required action |
|------|-------|-------|-----------------|
| Web bundler | Webpack | Vite | Replace `webpack` configuration and custom Webpack integrations. |
| Non-web builds | SWC | SWC | Usually no source changes. Confirm the project preset and output. |
| Web development | Webpack development server | Vite development server | Review server configuration and asset URLs. |
| Dynamic imports | Webpack chunks | Native Vite/Rollup chunks | Keep standard `import()` expressions unchanged. |
| Browser shims | Webpack polyfills | Targeted Vite shims | Verify any Node modules used in browser code. |
| Storybook | React Webpack framework | React Vite framework | Replace project-owned Webpack Storybook packages and configuration. |
| Runtime requirement | Depends on the v1 release | Node.js 22 or newer | Upgrade Node.js before installing Lex 2. |

Lex 2 retains GraphQL document imports, PostCSS processing, source maps, environment modes, library output, static rendering, bundle reports, static file copying, image optimization, SVG sprites, favicon and social-image generation, and gzip sidecars.

## 1. Prepare the project

Use a migration branch and make sure the existing v1 application builds and tests successfully. Commit the current lockfile before continuing because the optional migration command replaces it.

Confirm the Node.js version:

```bash
node --version
```

Lex 2 requires Node.js 22 or newer.

## 2. Upgrade Lex

For a project-local development dependency:

```bash
npm install --save-dev @nlabs/lex@^2
```

Use the equivalent command if the project uses another supported package manager.

### Optional dependency cleanup

After committing `package.json` and the lockfile, run:

```bash
lex migrate
```

The command removes `node_modules`, removes the npm and Yarn lockfiles, removes non-`@types` dependencies whose package names contain `vite` or `vitest`, and runs the package manager configured by Lex. Review direct Vite or Vitest dependencies before using it if the project intentionally owns those packages.

`lex migrate` does not convert Webpack configuration or application source code. The remaining steps are still required.

## 3. Replace the Lex configuration

Rename the top-level `webpack` property to `vite` and retain `staticPath` if the project uses it.

Lex 1:

```javascript
export default {
  entryHTML: 'index.html',
  entryJs: 'index.tsx',
  outputPath: './dist',
  preset: 'web',
  sourcePath: './src',
  targetEnvironment: 'web',
  useTypescript: true,
  webpack: {
    staticPath: './src/static'
  }
};
```

Lex 2:

```javascript
export default {
  entryHTML: 'index.html',
  entryJs: 'index.tsx',
  outputPath: './dist',
  preset: 'web',
  sourcePath: './src',
  targetEnvironment: 'web',
  useTypescript: true,
  vite: {
    base: '/',
    staticPath: './src/static'
  }
};
```

Do not leave both properties in the file. Lex 2 ignores `webpack`.

### Configuration mapping

| Lex 1 / Webpack setting | Lex 2 equivalent |
|-------------------------|------------------|
| `webpack.staticPath` | `vite.staticPath` |
| `webpack.entry` | Top-level `entryJs`, `lex build --entry`, or `vite.build` for an advanced multi-entry build |
| `webpack.output.path` | Top-level `outputPath` |
| `webpack.output.filename` | Top-level `outputFile`; use `outputHash` for Lex-managed hashed names |
| `webpack.resolve.alias` | `vite.resolve.alias` |
| `webpack.devServer` | `vite.server`; keep `dev.port` for Lex's default port |
| `webpack.plugins` | `vite.plugins` using Vite-compatible plugins |
| `webpack.module.rules` | Vite plugins or Vite-native asset and CSS handling |
| `DefinePlugin` | `vite.define` or Vite environment variables |
| `CopyWebpackPlugin` | `vite.staticPath`, conventional Lex asset directories, or `copyFiles` |
| `HtmlWebpackPlugin` | `<sourcePath>/<entryHTML>` as the Vite HTML entry |

Standard Vite options are placed directly inside `vite`. Project Vite plugins are appended to Lex's built-in plugin stack.

```javascript
import examplePlugin from 'vite-plugin-example';

export default {
  vite: {
    base: '/application/',
    plugins: [examplePlugin()],
    resolve: {
      alias: {
        '@app': '/src'
      }
    },
    server: {
      proxy: {
        '/api': 'http://localhost:4000'
      }
    }
  }
};
```

Only add a project plugin after confirming that Lex does not already provide the behavior.

## 4. Remove project-owned Webpack tooling

Remove Webpack packages that were added only for the Lex web build. Common examples include:

- `webpack`, `webpack-cli`, and `webpack-dev-server`
- `copy-webpack-plugin`, `compression-webpack-plugin`, and `html-webpack-plugin`
- `css-loader`, `style-loader`, and `mini-css-extract-plugin`
- `file-loader`, `url-loader`, and other Webpack-only loaders
- `favicons-webpack-plugin` and `image-minimizer-webpack-plugin`
- `dotenv-webpack`
- `@storybook/react-webpack5` and `@storybook/addon-styling-webpack`

Do not remove a package that another project-owned build still uses. Lex 2 supplies its own Vite and asset dependencies, so projects do not need to install Vite plugins for built-in Lex behavior.

Delete imports of Lex's former `webpack.config.js` and remove scripts that directly invoke Webpack for the Lex build.

## 5. Keep dynamic imports

Standard dynamic imports require no compatibility wrapper or plugin:

```typescript
export const loadDashboard = async () => import('./Dashboard.js');
```

Vite preserves the dynamic boundary and creates a production chunk. If a project builds a path dynamically, follow Vite's statically analyzable import rules or use `import.meta.glob`.

Webpack-specific APIs do require changes:

| Webpack API | Vite approach |
|-------------|---------------|
| `require.context(...)` | `import.meta.glob(...)` |
| `require.ensure(...)` | Standard `import()` |
| `__webpack_public_path__` | `vite.base` or `import.meta.env.BASE_URL` |
| Loader prefixes such as `raw-loader!./file` | Vite query imports or a Vite plugin |

Example glob migration:

```typescript
const modules = import.meta.glob('./views/*.tsx');

export const loadView = async (name: string) => {
  const loader = modules[`./views/${name}.tsx`];
  if(!loader) throw new Error(`Unknown view: ${name}`);
  return loader();
};
```

## 6. Verify browser polyfills

Lex 2 automatically injects `Buffer`, `process`, and `global`, and provides browser replacements for:

- `assert`
- `buffer`
- `http`
- `https`
- `os`
- `path`
- `process`
- `stream`
- `util`
- `vm`

`crypto` and `node:crypto` resolve to an empty compatibility module, matching Lex 1 behavior. Browser code that needs cryptography should use the browser Web Crypto API instead of relying on the Node module.

Test every browser path that uses a Node API. A module being resolvable does not mean every Node runtime method is available in a browser shim.

## 7. Migrate environment variables

Vite exposes mode-specific `.env` files through `import.meta.env`. Client-visible custom variables should use the `VITE_` prefix:

```dotenv
VITE_API_URL=https://api.example.com
```

```typescript
export const apiUrl = import.meta.env.VITE_API_URL;
```

Replace client-side values previously injected by `dotenv-webpack` or `DefinePlugin`. Lex continues to define `process.env.NODE_ENV`. For other intentionally compiled constants, use `vite.define`:

```javascript
export default {
  vite: {
    define: {
      __BUILD_ID__: JSON.stringify(process.env.BUILD_ID || 'local')
    }
  }
};
```

Never place secrets in client environment variables or compiled definitions; both are included in browser output.

## 8. Verify HTML and assets

Vite uses `<sourcePath>/<entryHTML>` as the web HTML entry when that file exists. Keep the application module referenced with a module script:

```html
<div id="root"></div>
<script type="module" src="/index.tsx"></script>
```

Lex 2 preserves its conventional asset pipeline:

| Source | Production destination | Behavior |
|--------|------------------------|----------|
| `vite.staticPath` | Output root | Recursively copied |
| `<sourcePath>/images` | `images` | Copied and optimized |
| `<sourcePath>/fonts` | `fonts` | Copied |
| `<sourcePath>/docs` | `docs` | Copied |
| `<sourcePath>/icons/*.svg` | `icons/icons.svg` | Combined into an optimized SVG sprite |
| `<sourcePath>/images/logo.png` | Output root | Generates favicons, manifests, Open Graph, and Twitter images |

Compressible production files of at least 8 KiB receive `.gz` sidecars. GIF, JPEG, PNG, SVG, and WebP assets are optimized.

Files in `vite.staticPath` are referenced from the site root. For example, `src/static/robots.txt` is `/robots.txt`. Conventional image files retain their directory prefix, such as `/images/banner.png`.

## 9. Update Storybook

Lex 2 uses Storybook's React Vite framework. If the project owns `.storybook/main.ts`, use:

```typescript
import type {StorybookConfig} from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)']
};

export default config;
```

Remove Webpack-only Storybook framework packages, addons, `webpackFinal` hooks, and loader rules. Convert necessary custom behavior to Vite plugins or a `viteFinal` hook. See the [Storybook guide](src/commands/storybook/README.md) for Lex-managed configuration.

## 10. Validate the migration

Inspect the fully resolved Vite configuration:

```bash
lex config vite
```

Then validate development, tests, and a clean production build:

```bash
lex dev
lex test --unit
lex build --bundler vite --mode production --remove
```

Check the following in both development and the production output:

- The application starts and client-side routes load directly.
- Every dynamic route or feature creates and loads its chunk.
- CSS, fonts, images, documents, and the SVG sprite resolve under the configured `base`.
- Favicons and social images are generated when `images/logo.png` exists.
- Browser code using `Buffer`, `process`, or Node module shims works as expected.
- GraphQL document imports resolve.
- Environment-specific API URLs contain the expected non-secret values.
- The deployment server serves precompressed `.gz` files when configured to do so.

## Troubleshooting

### A blank page or missing entry module

Confirm that `entryHTML` is relative to `sourcePath` and that its module script points to the source entry. Run `lex config vite` and inspect `root` and `build.rolldownOptions.input`.

### Assets return 404

Check `vite.base`, `vite.staticPath`, and the source directory conventions above. Do not include `src/static` in a public URL; files from that directory are served from the site root.

### A dependency imports an unsupported Node module

Prefer a browser-native dependency or add a narrowly scoped Vite alias/plugin. Avoid reinstalling a broad Node polyfill bundle unless the application has verified runtime requirements beyond Lex's targeted shims.

### A custom Webpack plugin has no Vite equivalent

First determine whether Lex 2 already covers the output. Otherwise, replace it with a Vite/Rollup-compatible plugin or a small project plugin. Webpack plugins cannot be placed in `vite.plugins`.

### The production deployment works at `/` but not a subpath

Set `vite.base` to the deployment prefix and verify that application routing uses the same base.

## Completion checklist

- [ ] Node.js is version 22 or newer.
- [ ] `@nlabs/lex` is version 2.x.
- [ ] The `webpack` property and Lex Webpack imports are removed.
- [ ] Required custom configuration has Vite equivalents.
- [ ] Webpack-only dependencies and scripts are removed.
- [ ] Dynamic imports and former Webpack-specific import APIs are tested.
- [ ] Client environment variables use Vite-compatible access.
- [ ] Storybook uses the React Vite framework.
- [ ] Development, unit tests, and a clean production build pass.
- [ ] Production chunks, assets, favicons, sprites, and gzip files are verified.

