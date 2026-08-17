# Development command

`lex dev` starts the Vite development server for web projects.

```bash
lex dev
lex dev --open --port 4200
lex dev --bundleAnalyzer
```

The server provides the same polyfills, GraphQL transformation, PostCSS processing, SVG sprite, favicon, and static asset behavior as production builds. Configure a default port with `dev.port` in `lex.config.js`; the CLI `--port` option takes precedence.

Vite serves files from `vite.staticPath`, `src/images`, `src/fonts`, `src/docs`, and `src/icons` without requiring a production copy step. Source modules are transformed through Vite's development module graph.

Lex 2 no longer accepts a custom Webpack configuration for `lex dev`. Add supported Vite options to the `vite` property in `lex.config.js` instead.
