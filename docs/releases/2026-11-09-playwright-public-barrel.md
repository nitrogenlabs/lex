# Lex 2.1.5 public Playwright entry qualification

Candidate intent: publish the frozen reviewed archive using public Lex immutable
archive publication, lifecycle scripts disabled, explicit `vault-cutover` tag.
Preserve `latest` at 2.1.2, `vault-migration` at 2.1.4 and every other existing tag.
This ledger records local qualification; publication and registry adoption remain
separate until exact registry bytes and tags are verified.

Baseline is committed source `6813c69a4de784c601fa15ec26397b8aa9c48cc5`, the verified
2.1.4 superset. Its published archive SHA256 is
`411989c43b64eacb75cfa3822de1a4e127dff9cb7b400f30b5717fca732c9052`.
All 52 embedded runtime source-map sources and the semantic package manifest
match that commit. The registry's older literal gitHead identifies stale source;
2.1.5 removes that stale manifest field. The 2.1.4 runtime/peer-graph fixes and
all eight corresponding tests are preserved.

The additive entry `@nlabs/lex/test-playwright` forwards the installed owner runner
and its public assertion, fixture and framework type aliases. There is no app
runner dependency, private import, alias, symlink or copied protocol.

Frozen archive: `nlabs-lex-2.1.5.tgz`, 179 payload files, SHA256
`3c38c314a6b34725cacb0491e3d092494142b6ac0cabeb2eb83a609f12aa266a`.
Its runtime build passed (54 files and declarations). Owner unit suite: 551 tests
in 85 files passed. Public entry identity tests and 90% coverage thresholds pass
(the forwarding barrel introduces no executable branches). Scoped lint passes.

The exact frozen archive passed strict NodeNext and Bundler public types,
callback fixture inference, unassisted negative TS2322/TS2339 checks, and the
actual installed Lex Playwright command in two independent disposable consumers:

- npm nested installation, no direct Playwright dependency.
- Yarn Classic 1.22.22 workspace, normal optional dependencies, Playwright kept
  below Lex through supported nohoist settings. Bare consumer runner resolution
  is absent; the public entry resolves the nested owner runner.

Evidence is retained in `/tmp/vault-lex-playwright-evidence/npm-nested-final` and
`/tmp/vault-lex-playwright-evidence/yarn-nohoist`; source fixtures and the public
qualification script are committed here. Initial Yarn installation exhausted
host disk. The lean no-optional attempt correctly failed on missing SWC native
bindings. A subsequent normal frozen-lockfile install and all checks passed;
those failures were diagnosed, not waived. Disposable node_modules may be removed
after preserving layout/manifests/logs; immutable archives and evidence remain.
