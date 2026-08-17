# Build command

`lex build` uses Vite for `web` projects and SWC for `node`, `lambda`, and `mobile` projects. Override the selection with `--bundler vite` or `--bundler swc`.

```bash
lex build --mode production --remove
lex build --bundler vite --analyze
lex build --bundler swc --format cjs
lex build --static
```

Vite web builds include dynamic imports, code splitting, Node browser polyfills, PostCSS, GraphQL documents, optimized images, SVG sprites, favicons, copied static assets, and gzip sidecars. `--static` loads the entry as an SSR module and renders `/` plus discovered local links.

Projects can add Vite options through the `vite` property in `lex.config.js`. Lex's required plugins remain active unless explicitly replaced.
