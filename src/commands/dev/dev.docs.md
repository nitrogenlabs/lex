# Development command

`lex dev` starts the Vite development server for web projects.

```bash
lex dev
lex dev --open --port 4200
lex dev --bundleAnalyzer
```

The server provides the same polyfills, GraphQL transformation, PostCSS processing, SVG sprite, favicon, and static asset behavior as production builds. Configure a default port with `dev.port` in `lex.config.js`; the CLI `--port` option takes precedence.
