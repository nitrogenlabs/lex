# Config command

`lex config <type>` resolves `app`, `vite`, or `vitest` configuration.

```bash
lex config app
lex config vite --json ./vite-config.json
lex config vitest
```

The Vite output represents Lex's resolved web defaults merged with the project's `vite` configuration.
