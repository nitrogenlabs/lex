# Development command

`lex dev` starts the Vite development server for web projects.

```bash
lex dev
lex dev --open --port 4200
lex dev --bundleAnalyzer
```

The server provides the same polyfills, GraphQL transformation, PostCSS processing, SVG sprite, favicon, and static asset behavior as production builds. Configure a default port with `dev.port` in `lex.config.js`; the CLI `--port` option takes precedence.

Lex binds the development server to all network interfaces and accepts every hostname by default. This makes an application available to other devices on the same network through an address such as `http://my-computer.local:4200` or the private IP shown by `lex dev`. Only use this behavior on a trusted development network; the operating-system firewall still determines whether another device can connect.

Restrict a project to the local machine when network access is not needed:

```javascript
export default {
  vite: {
    server: {
      allowedHosts: ['localhost'],
      host: '127.0.0.1'
    }
  }
};
```

Lex disables browser response caching and forces Vite to refresh optimized dependencies whenever the development server starts. This prevents applications from receiving stale source or dependency output after a refresh. Projects can override these defaults through `vite.server.headers` and `vite.optimizeDeps.force` when caching is intentionally required.

Vite serves files from `vite.staticPath` and the `images`, `fonts`, `docs`, and `icons` directories under `sourcePath` without requiring a production copy step. Source modules are transformed through Vite's development module graph.

Lex 2 no longer accepts a custom Webpack configuration for `lex dev`. Add supported Vite options to the `vite` property in `lex.config.js` instead.
