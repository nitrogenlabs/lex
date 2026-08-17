# Changes

## 2.0.0

### Breaking changes

- Replaced Webpack with Vite for web development and production builds.
- Removed Lex's Webpack configuration files, dependency stack, loaders, plugins, and Webpack-specific build options.
- Replaced the `webpack` configuration property with `vite`.
- Web projects now default to Vite; Node, Lambda, and mobile projects default to SWC.
- Requires Node.js 22 or newer.

### Vite migration

- Preserved native dynamic imports and production code splitting.
- Ported GraphQL loading, PostCSS, source maps, environment handling, library builds, SSR loading, and bundle reports.
- Ported browser shims for Buffer, process, global, and supported Node modules.
- Ported static copying, image optimization, SVG sprites, favicons, Open Graph and Twitter images, and gzip sidecars.
- Added recursive static-site rendering through Vite's SSR module loader.
- Added `lex config vite` for inspecting the resolved web configuration.
