# Build command

`lex build` uses Vite for `web` projects and SWC for `node`, `lambda`, and `mobile` projects. Override the selection with `--bundler vite` or `--bundler swc`.

```bash
lex build --mode production --remove
lex build --bundler vite --analyze
lex build --bundler swc --format cjs
lex build --static
```

Vite web builds include dynamic imports, code splitting, Node browser polyfills, PostCSS, GraphQL documents, optimized images, SVG sprites, favicons, copied static assets, and gzip sidecars. `--static` loads the entry as an SSR module and renders `/` plus discovered local links.

Projects can add Vite options and plugins through the `vite` property in `lex.config.js`. Project plugins are appended to Lex's required plugin stack.

## Web asset pipeline

- `vite.staticPath` is copied to the output root.
- `images`, `fonts`, and `docs` under the configured `sourcePath` are copied to matching output directories.
- SVG files in `<sourcePath>/icons` are combined into `icons/icons.svg`; other icon files are copied normally.
- `<sourcePath>/images/logo.png` generates favicons, manifests, Open Graph and Twitter images, and the required HTML tags.
- GIF, JPEG, PNG, SVG, and WebP assets are optimized for production.
- Compressible assets of at least 8 KiB receive precompressed `.gz` files.

Browser builds shim `assert`, `buffer`, `http`, `https`, `os`, `path`, `process`, `stream`, `util`, and `vm`. They also provide `Buffer`, `global`, and `process` globals. As in Lex 1, browser `crypto` imports resolve to an empty shim.

## Static rendering

With `--static`, the entry module must export a render function as its default export or as `render`. Lex renders `/`, discovers local links in the returned HTML, and recursively writes each route as an HTML file.

## Lex 1 migration

Webpack configuration and Webpack-specific Lex options are not supported in Lex 2. Rename the `webpack` configuration property to `vite`, remove references to Lex's former `webpack.config.js`, and use native Vite configuration for project-specific behavior. Dynamic `import()` expressions require no migration.
