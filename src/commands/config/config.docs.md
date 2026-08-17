# Config command

`lex config <type>` resolves `app`, `vite`, or `vitest` configuration.

```bash
lex config app
lex config vite --json ./vite-config.json
lex config vitest
```

The Vite output represents Lex's resolved web defaults merged with the project's `vite` configuration.

In Lex 2, `vite` replaces the former `webpack` configuration type. `lex config webpack` is no longer supported.
