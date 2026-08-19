# Storybook command tests

The Storybook command is covered by three Vitest suites:

- `storybook.cli.test.ts` covers defaults, custom configuration, ports, static builds, variables, missing stories, missing binaries, execution failures, and quiet output.
- `storybook.integration.test.ts` covers story discovery, project framework dependencies, output directories, combined options, filesystem failures, and process failures.
- `storybook.options.test.ts` covers public `StorybookOptions` combinations and verbose output.

Filesystem access, Storybook execution, binary resolution, and project discovery are mocked. The tests validate Lex's React Vite defaults without launching a Storybook server.

Run them from the repository root:

```bash
npx vitest run src/commands/storybook/storybook.cli.test.ts src/commands/storybook/storybook.integration.test.ts src/commands/storybook/storybook.options.test.ts
```
