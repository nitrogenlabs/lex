# Compile command tests

The compile command is covered by two Vitest suites:

- `compile.cli.test.ts` covers file discovery, TypeScript declarations, PostCSS, asset copying, SWC transforms, React Compiler configuration, errors, callbacks, formats, paths, removal, and watch behavior.
- `compile.options.test.ts` covers default, quiet, output-path, and removal options.

External processes, filesystem operations, glob results, Lex configuration, and spinners are mocked so the tests exercise command orchestration without changing a real project.

Run the suites from the repository root:

```bash
npx vitest run src/commands/compile/compile.cli.test.ts src/commands/compile/compile.options.test.ts
```
