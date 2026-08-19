# Test command tests

The test command is covered by four Vitest suites:

- `test.test.ts` covers Vitest and Playwright selection, failure propagation, AI generation, AI analysis, AI debugging, and representative option forwarding.
- `test.cli.test.ts` covers the basic command contract and Vitest failures.
- `test.integration.test.ts` covers the integrated command workflow with mocked process boundaries.
- `test.options.test.ts` covers filtering, coverage, configuration, debugging, setup, watch, snapshots, TypeScript behavior, and E2E selection.

The suites mock external test runners and `aiFunction`; they do not launch nested Vitest or Playwright processes.

Run them from the repository root:

```bash
npx vitest run src/commands/test/test.test.ts src/commands/test/test.cli.test.ts src/commands/test/test.integration.test.ts src/commands/test/test.options.test.ts
```
