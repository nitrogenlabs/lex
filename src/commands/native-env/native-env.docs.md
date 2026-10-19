# native-env

Runs Docker Compose run --rm --no-deps with inherited caller cwd/env/stdio and exact command argv after --. Defaults android/bash. Optional --composeFile/--cwd/--service/--workdir. Forwards termination signals and child status. Does not install SDKs or start dependencies.

## Test ownership

Run native unit and CLI checks with
`node lib/lex.js test --config vitest.native.config.mts`; the existing native
per-file 90% coverage thresholds remain unchanged.

The portable process smoke check runs with
`node lib/lex.js test --e2e --testPathPattern src/commands/native-env/native-env.e2e.ts`.
It resolves this checkout's built public CLI relative to the test module, starts
fake Docker in an owned temporary directory, observes readiness, sends SIGTERM,
and checks exit 143 without a terminating signal. Its PATH cannot discover host
native tools, and no sibling repositories are required.

App wrapper locators, executable modes, fixed doctor profiles and caller cwd
belong to app suites: Pulsify's mobile workspace and The Kurupt's root expose
`npm run test:native-wrappers`. Both qualify the reviewed immutable private Lex
2.1.1 archive; its publication remains separate work. Pulsify omits the explicit
Bundler diagnostic, while The Kurupt requires it. Fake-tool smoke checks do not
establish native builds, device behavior or cloud acceptance.
