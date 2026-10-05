# Websocket Stage Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reviewed Lex command that moves Phantaze's websocket stages to separate baseline aliases, with a dev checkpoint, guarded production resume, and recoverable rollback.

**Architecture:** A typed manifest drives read-only AWS discovery and an exclusive private journal. Migration and rollback use the same journaled mutation runner; the public CLI remains a thin adapter. Consumer configuration stays in Phantaze, while orchestration and regression tests stay in Lex.

**Tech Stack:** TypeScript, Node 24, existing Lex/execa and AWS CLI v2, Lex-bundled Vitest and Playwright. Add no dependencies.

**Spec:** [Approved migration spec](../specs/2026-10-05-websocket-stage-migration-design.md). User approved proceeding on October 5, 2026.

## Global Constraints

- Use the AWS CLI already required by Lex's promotion command; add no AWS SDK or second deployment stack.
- Restrict this first version to same-account AWS_PROXY Lambda integrations using the standard invocation URI.
- Every new implementation module must meet at least 90% coverage in all metrics.
- Never print or persist Lambda environment values.
- Keep journals outside tracked source and never include credentials or raw AWS command output.
- Do not automatically delete aliases or versions.
- Live execution requires a separately reviewed plan and authorization for both stages, including production routing changes.
- Do not weaken tests or publish while release gates remain red.
- Preserve unrelated dirty AGENTS.md, package manifests/lockfiles, and Phantaze branding/session changes. Stage exact task files; never use `git add -A`.
- Native execution is recommended for this implementation because tasks share tightly coupled journal/state interfaces; obtain plan review and execution-method selection before implementation.

## Review Focus

1. Lost AWS write response: reconcile an intended write through a subsequent read, never blindly repeat it (Task 4).
2. Malicious or replaced journal path: refuse symlinks/nonregular files, validate journal identity/schema, and serialize local writers (Task 3).
3. Unselected route shares a selected integration: reject before writes rather than reroute unrelated traffic (Task 2).
4. Retried apply at the dev checkpoint: report pending production until the explicit resume flag is supplied (Task 4).
5. Original deployment removed after planning: stop before rollback mutations and report manual recovery (Task 5).

## File Map

All Lex command files live in `src/commands/serverless-stages/`.

| File | Responsibility |
| --- | --- |
| `types.ts` | Manifest, sanitized discovery, journal, operation, client/store contracts. |
| `manifest.ts` + `manifest.test.ts` | Strict manifest validation and canonical manifest digest. |
| `aws.ts` + `aws.test.ts` | AWS CLI boundary, default CLI pagination, structured not-found handling, safe errors. |
| `discovery.ts` + `discovery.test.ts` | Complete inventory, baseline comparison, alias/policy checks; sanitized snapshots. |
| `journal.ts` + `journal.test.ts` | Exclusive creation, validated reads, atomic restricted writes, local operation lock. |
| `mutations.ts` + `mutations.test.ts` | Write-ahead intent, confirmation, ambiguous-write reconciliation. |
| `migration.ts` + `migration.test.ts` | Baseline aliases, permissions, stage freeze, URI migration, dev checkpoint and prod resume. |
| `rollback.ts` + `rollback.test.ts` | Guarded restoration of routing/settings; retain inert created resources. |
| `serverless-stages.ts` + `serverless-stages.test.ts` | CLI/programmatic adapter and lifecycle/exit status. |
| `serverless-stages.e2e.ts`, `fixtures/aws.cjs`, `fixtures/manifest.json` | Controlled subprocess boundary and packaged CLI scenarios. |
| `serverless-stages.docs.md` | Supported command contract, operator window, journal and checkpoint semantics. |

Modify Lex `src/lex.ts`, `src/index.ts`, `README.md`, and `scripts/validate-docs.js` for registration/documentation. Create Phantaze `config/websocket-stages.json` only for the resource descriptor; update its deployment guide and the shared architecture audit at verification time.

## Shared Interfaces

Define these contracts in Task 1; later tasks consume them without renaming fields:

- `Json = null | boolean | number | string | Json[] | {[key: string]: Json}`; `JsonObject = {[key: string]: Json}`.
- `StageTarget = {alias: string; name: string; order: number}`.
- `RouteBinding = {baselineVersion: string; functionName: string; integrationId: string; routeKey: string}`.
- `StageManifest = {accountId: string; apiId: string; bindings: RouteBinding[]; region: string; schemaVersion: 1; stages: StageTarget[]; stageVariable: string}`.
- `StageRecord = {autoDeploy: boolean; deploymentId: string; name: string; settings: JsonObject; variables: Record<string, string>}`.
- `AliasRecord = {functionName: string; name: string; revisionId?: string; routingWeights: Record<string, number>; version: string} | null`.
- `BaselineRecord = {aliases: Record<string, AliasRecord>; codeSha256: string; functionName: string; revisionId: string; version: string}`.
- `PermissionRecord = {alias: string; functionName: string; policy: JsonObject | null; revisionId?: string}`.
- `StageSnapshot = {accountId: string; api: JsonObject; baselines: BaselineRecord[]; deployments: JsonObject[]; integrations: JsonObject[]; permissions: PermissionRecord[]; routes: JsonObject[]; stages: StageRecord[]}`. Never include Lambda environment/configuration values in this sanitized result.
- `OperationKind = 'create-alias' | 'add-permission' | 'freeze-stage' | 'set-variables' | 'set-integration' | 'create-deployment' | 'activate-stage' | 'restore-auto-deploy'`.
- `MigrationOperation = {after: JsonObject | null; before: JsonObject | null; id: string; kind: OperationKind; resource: string; status: 'pending' | 'intent' | 'confirmed'}`. Dynamic deployment ID is filled after confirmation; the intent uses a unique migration description to find uncertain creations.
- `MigrationPhase = 'planned' | 'preparing' | 'dev-ready' | 'complete' | 'rollback-in-progress' | 'rolled-back' | 'needs-reconcile'`.
- `MigrationJournal = {deploymentId?: string; manifest: StageManifest; manifestDigest: string; migrationId: string; operations: MigrationOperation[]; original: StageSnapshot; phase: MigrationPhase; schemaVersion: 1}`. `migrationId` is a generated UUID, never caller executable input.
- `AwsService = 'apigatewayv2' | 'lambda' | 'sts'`; `AwsStageClient = {read(service: AwsService, operation: string, args: readonly string[]): Promise<JsonObject>; write(service: AwsService, operation: string, args: readonly string[]): Promise<JsonObject>}`. Allow only the operations this command needs; use argument arrays, never shell interpolation. AWS wait/poll operations are bounded, with injectable timing in tests.
- `JournalStore = {save(journal: MigrationJournal): Promise<void>}`. Functions mutate the in-memory journal only after recording/confirming the corresponding state through this store.

### Task 1: Strict manifest contract

**Files:** Create `types.ts`, `manifest.ts`, `manifest.test.ts`, `fixtures/manifest.json` in the command folder.

**Interfaces:** Produce `parseStageManifest(input: unknown): StageManifest` and `digestStageManifest(manifest: StageManifest): string` (SHA-256 of recursively sorted object keys; preserve semantic array order).

- [ ] **Step 1:** Write table-driven failing tests named `accepts the complete Phantaze descriptor`, `rejects unknown fields and executable hooks`, `rejects duplicate or invalid resources`, and `requires contiguous unique rollout order starting at zero`. Use the exact four bindings in the spec and stages `{alias: 'dev', name: 'dev', order: 0}` and `{alias: 'prod', name: 'prod', order: 1}`. Assert invalid baseline `$LATEST`, numeric alias, wildcard stage, invalid account/region/API/variable identifiers, empty bindings/stages, inconsistent versions for one function, duplicate route/integration conflicts, and credential keys throw.
- [ ] **Step 2:** Run `node lib/lex.js test --testPathPattern src/commands/serverless-stages/manifest.test.ts`. Confirm failure from absent validation, not malformed fixtures/import syntax; start with a minimal exported stub if necessary.
- [ ] **Step 3:** Implement the two exact interfaces and shared types. Permit a shared integration only when its function/version agree; discovery must still verify all references. Alphabetize object keys/props and use typed arrow functions.
- [ ] **Step 4:** Assert a manifest with reordered object keys has the same digest and a changed stage alias/binding/order has a different digest. Run the manifest tests and scoped coverage; require all metrics >=90%.
- [ ] **Step 5:** Commit only the four task files: `git add src/commands/serverless-stages/{types.ts,manifest.ts,manifest.test.ts,fixtures/manifest.json}` then `git commit -m "Validate websocket stage migration manifests"`.

### Task 2: AWS discovery and baseline verification

**Files:** Create `aws.ts`, `aws.test.ts`, `discovery.ts`, `discovery.test.ts`.

**Interfaces:** Consume Task 1 types. Produce `createAwsStageClient(region: string): AwsStageClient`, `isAwsNotFound(error: unknown): boolean`, and `discoverStageSnapshot(manifest: StageManifest, client: AwsStageClient, journal?: MigrationJournal): Promise<StageSnapshot>`.

- [ ] **Step 1:** Write failing boundary tests named `captures AWS JSON without inheriting output`, `uses AWS CLI default pagination`, `distinguishes not found from access denied`, and `sanitizes errors containing environment values`. Model execa stdout/stderr at the external boundary; assert the command's result/error and emitted argument contract, not mock existence. Do not pass `--no-paginate` or query away aggregate page data. Return a typed not-found error only for AWS ResourceNotFoundException; malformed JSON and all other failures are errors.
- [ ] **Step 2:** Write discovery cases named `validates complete stages and every integration reference`, `rejects an unselected route sharing the chosen integration`, `compares baseline configuration in memory`, and `preserves unrelated resource settings`. Assert the snapshot excludes environment values. Fail on extra stages, cross-account or unrelated qualified URIs, non-WebSocket protocol, non-AWS_PROXY integration, integration role credentials, missing routes/deployments, weighted/conflicting aliases, missing/pending version, and mismatched baseline code/configuration.
- [ ] **Step 3:** Run both test files through `node lib/lex.js test --testPathPattern src/commands/serverless-stages/`; confirm these tests fail before implementation.
- [ ] **Step 4:** Implement discovery with STS identity, API/stages/routes/integrations/deployments, function version/latest configuration, requested aliases and qualified policies. Compare all spec-listed versioned fields, using SnapStart ApplyOn rather than optimization status, and excluding runtime-derived metadata. With a validated journal, accept only its original URI or exact intended `:${stageVariables.websocketAlias}` URI, and inspect both original and newly recorded deployments; unrelated qualifications still fail. Match existing permission IDs by complete action/principal/resource/source-account/source-ARN semantics; preserve unrelated statements. Never log or return raw Lambda configuration.
- [ ] **Step 5:** Run the two files plus manifest tests with >=90% per-module coverage. Commit the four new files as `Discover guarded websocket migration baselines`.

### Task 3: Private journal and local writer lock

**Files:** Create `journal.ts`, `journal.test.ts`.

**Interfaces:** Consume Task 1/2 types. Produce `createMigrationJournal(path: string, manifest: StageManifest, snapshot: StageSnapshot): Promise<MigrationJournal>`, `readMigrationJournal(path: string, manifest: StageManifest): Promise<MigrationJournal>`, `createJournalStore(path: string): JournalStore`, and `withJournalLock<T>(path: string, work: () => Promise<T>): Promise<T>`.

- [ ] **Step 1:** Write failing filesystem tests using real temporary directories: `creates a private journal exclusively`, `rejects symlink and nonregular paths`, `rejects wrong schema manifest or identity`, `serializes writers and releases the lock on failure`, and `keeps the previous journal valid after a failed atomic update`. Assert POSIX mode `0o600`; refuse overwriting existing journals, following symlinks, executing arbitrary journal actions, or storing Lambda environment fields. Validate every phase/operation and recompute the manifest digest on read.
- [ ] **Step 2:** Run `node lib/lex.js test --testPathPattern src/commands/serverless-stages/journal.test.ts` and observe failures.
- [ ] **Step 3:** Use exclusive create/no-follow flags, a same-directory temporary file with restricted mode, fsync and rename for updates, and an exclusive sibling lock file. Validate trusted parent paths and existing file identity before replacement. Do not silently break an existing lock; report that an operator must reconcile abandoned locks. Initialize UUID `migrationId`, phase `planned`, and empty operations. Keep stage variable values in the private file only.
- [ ] **Step 4:** Run filesystem tests with injected write/rename failures and >=90% coverage. Commit journal implementation/tests as `Persist private migration journals safely`.

### Task 4: Journaled mutations and migration checkpoint

**Files:** Create `mutations.ts`, `mutations.test.ts`, `migration.ts`, `migration.test.ts`.

**Interfaces:** Consume Tasks 1–3. Produce `runJournaledMutation(journal: MigrationJournal, store: JournalStore, operation: MigrationOperation, readCurrent: () => Promise<JsonObject | null>, mutate: () => Promise<JsonObject | null>): Promise<JsonObject | null>` and `applyStageMigration(manifest: StageManifest, journal: MigrationJournal, client: AwsStageClient, store: JournalStore, resumeProduction: boolean): Promise<'dev-ready' | 'complete'>`.

- [ ] **Step 1:** Write failing mutation tests named `persists intent before writing`, `confirms by read before advancing progress`, `reconciles a lost successful write response`, `does not repeat a confirmed write`, and `stops on a third state`. Assert that each write is preceded by durable intent, a write exception leads to read reconciliation, and a result matching neither before nor after sets phase `needs-reconcile`. For create-deployment, locate the intended deployment through exact description `Lex stage migration <migrationId>`; zero matches means not created, one matching snapshot can confirm, and multiple matches stop. Never infer success from an arbitrary newly listed deployment.
- [ ] **Step 2:** Write migration tests named `creates six baseline aliases and eight route permissions before freezing routing`, `pauses both stages before URI writes`, `activates dev before the production checkpoint`, `does not resume production on retry without the flag`, and `requires a verified dev checkpoint for production resume`. Use literal counts/Phantaze resource IDs from the spec; existing matching aliases/permissions are reused. Assert both aliases always remain version `1`, stage variables merge, and all route/authorization/unrelated fields stay unchanged.
- [ ] **Step 3:** Add a table-driven failure test after every successful mutation in the happy path. Assert prod retains its original deployment before explicit resume; no URI changes follow a failed freeze; failed/pending deployment polling stops before stage activation; rollback information survives each failure. Exercise stale Lambda revisions, policy revision conflicts, stage/integration drift, access denied, already-matching state, and unexpected externally modified state.
- [ ] **Step 4:** Run all new tests before implementing. Then implement the runner and apply ordering exactly as spec steps 1–7: aliases, permissions, auto-deploy freeze, variables, URIs, bounded deployment wait, dev checkpoint, explicit production resume, and original auto-deploy restoration. Derive permission IDs as `lex-<apiId>-<stage>-<first16 SHA256(routeKey)>`; validate their full semantics on collision. Source ARNs must include the literal stage and route key. Pass policy revisions to add-permission where available and reread between changes.
- [ ] **Step 5:** Project read results onto stable semantic resource fields before comparison, excluding generated timestamps/revisions from equality; retain confirmed revisions for subsequent AWS guards. Migration operations can touch only manifest-declared resources. Reread all preflight resources before initial writes and preserve the recorded expected state on resume. Require the documented exclusive operator window; local journal locking cannot exclude external AWS writers.
- [ ] **Step 6:** At `dev-ready`, a normal apply only re-verifies and reports the checkpoint. `resumeProduction=true` is valid only at that checkpoint after dev/operator attestation; reject it at `planned`, incomplete preparation, reconciliation, or rollback phases. A completed normal apply verifies final state and is idempotent. Wait/poll uses a 300-second deadline and an injectable one-second delay, stopping immediately on failed deployment status. Restore original auto-deploy modes only after both stage mappings verify; reread effective state afterward.
- [ ] **Step 7:** Run all migration/mutation tests and >=90% per-module coverage. Commit the four files as `Migrate websocket routing through a dev checkpoint`.

### Task 5: Drift-aware rollback

**Files:** Create `rollback.ts`, `rollback.test.ts`.

**Interfaces:** Consume `runJournaledMutation` and all earlier types. Produce `rollbackStageMigration(manifest: StageManifest, journal: MigrationJournal, client: AwsStageClient, store: JournalStore): Promise<'rolled-back'>`.

- [ ] **Step 1:** Write failing cases named `restores original deployments before removing alias variables`, `preserves unrelated settings and created aliases`, `rejects unavailable original deployments before writing`, and `resumes a partially confirmed rollback`. Assert original deployment `outf7t`, original URI strings, empty original variable maps, and original auto-deploy `true` are restored in the Phantaze fixture. A created dev/prod alias or invocation statement is not deleted. Preserve a second fixture's unrelated variable, throttling/logging settings, and policy statement.
- [ ] **Step 2:** Add failure-after-each-rollback-write and concurrent-drift cases. Verify failed/uncertain restoration is recorded, no later destructive write follows drift, duplicate rollback reconciles rather than rewrites confirmed resources, and final AWS-generated deployment IDs may differ only when their effective configuration matches original routing. Rolling back a `planned` journal without mutations simply verifies original state and marks it rolled back.
- [ ] **Step 3:** Run rollback tests to observe red, implement freeze -> original stage deployment associations -> original working integration URIs -> original variable maps -> original auto-deploy settings. Use the shared mutation runner, validate original snapshot availability first, and retain the journal with verified `rolled-back` phase. Reject apply of a rolled-back journal; a new plan is required to migrate again.
- [ ] **Step 4:** Run rollback and migration tests together, with >=90% rollback coverage. Commit as `Restore journaled websocket routing safely`.

### Task 6: Public command and lifecycle

**Files:** Create `serverless-stages.ts`, `serverless-stages.test.ts`, `serverless-stages.docs.md`. Modify `src/lex.ts`, `src/index.ts`, `README.md`, `scripts/validate-docs.js`.

**Interfaces:** Consume the functions from Tasks 1–5. Produce/export `ServerlessStagesOptions = {journal: string; manifest: string; mode?: 'plan' | 'apply' | 'rollback'; quiet?: boolean; resumeProduction?: boolean}` and `serverlessStages(options: ServerlessStagesOptions, callback?: (status: number) => void): Promise<number>` through Lex's ESM entry.

- [ ] **Step 1:** Write failing adapter tests named `plan performs reads and creates an exclusive journal`, `apply requires the identical manifest and serializes journal writers`, `checkpoint success explicitly reports pending production`, `rejects production resume in other modes`, and `sanitizes failures and releases locks`. Assert status/callback `0` for plan, dev checkpoint, complete migration, or rollback; `1` for validation/discovery/write/reconciliation failure. Quiet suppresses output without changing exit status. Never use a generic success message for a pending-production checkpoint.
- [ ] **Step 2:** Run the adapter tests to observe red, then implement the exact public interface with default mode `plan`. Read manifest JSON, validate it, and invoke discovery/journal creation for plan; use validated journal plus lock for apply/rollback. Reject unknown CLI modes and `--resume-production` outside apply. Lock plan creation too so two planners cannot race through the same journal path.
- [ ] **Step 3:** Register `lex serverless-stages` with required `--manifest <path>` and `--journal <path>`, mode choices `plan|apply|rollback` defaulting to plan, and boolean `--resume-production`/`--quiet`. Export only supported public command/types; consumer code must not import internal modules. Add README command link and docs-validator mapping. Do not alter legacy CommonJS entry.
- [ ] **Step 4:** Document private journal contents/mode, AWS IAM operations required, exclusive operator window, state-dependent resume flag, bounded polling, partial failure recovery, inert retained resources, and dev/operator attestations. Distinguish fixture verification from live traffic checks. Give complete plan/apply/resume/rollback examples using a temporary journal path outside source.
- [ ] **Step 5:** Run adapter tests with >=90% coverage, `npm run build` (including declaration generation), `npm run lint` (zero warnings), and `node scripts/validate-docs.js`. Run build before any command loading compiled `lib`; do not execute tests concurrently with replacement of `lib`. Commit only these seven files as `Expose websocket stage migration in Lex`.

### Task 7: Packaged consumer scenarios and reviewable deliverable

**Files:** Create `serverless-stages.e2e.ts`, `fixtures/aws.cjs` in Lex; create `/Users/nitrog7/Development/phantaze/config/websocket-stages.json`. Update Phantaze `docs/deployment.md` and `/Users/nitrog7/Development/nitrogenx/docs/architecture-audit/tooling-and-packages.md`.

**Interfaces:** Consume the public packaged `serverlessStages` export/CLI and exact Task 1 manifest schema. The controlled AWS executable persists fixture state in a private temporary directory; it is test-only and performs no network requests.

- [ ] **Step 1:** Create the Phantaze descriptor with `schemaVersion: 1`, account `193018249461`, API `wrql5l5q3l`, region `us-east-1`, variable `websocketAlias`, dev order `0`, prod order `1`, and all four exact route/function/version bindings from the spec. Add no credentials, local absolute runtime paths, or deployment wrapper scripts.
- [ ] **Step 2:** Write failing Playwright CLI cases named `plans without AWS mutations`, `applies only through dev checkpoint`, `repeated apply does not touch prod`, `explicit resume completes both stage mappings`, `rollback restores original effective routing`, and `uncertain writes reconcile without duplicate resources`. Assert actual fixture resources and journal phases after subprocess exits; never assert source text. Include command failures and unrelated resource data in the fixture.
- [ ] **Step 3:** After the build completes, run `node lib/lex.js test --e2e --testPathPattern src/commands/serverless-stages/serverless-stages.e2e.ts`. Fix real behavior, never weaken assertions/timeouts. These are CLI scenarios using Playwright without browser/UI fixtures.
- [ ] **Step 4:** Pack without publishing using `npm pack --ignore-scripts --pack-destination /tmp/lex-stage-package --json`. Install/extract into a dedicated temporary consumer, resolving the already validated dependencies there; never patch installed Phantaze dependencies as an adoption shortcut. Run the same scenarios against the packed CLI and import the public ESM function. Verify emitted declaration types and consumer descriptor validation through public interfaces.
- [ ] **Step 5:** Run full `VITEST_MAX_WORKERS=2 npm test`, `npm run type-check:test`, build/declarations, lint, docs validation, and coverage for every new module. Record each baseline failure by file/name. Current known failures are Vitest `5.0.1` literal versus committed `5.0.3` and PostCSS test types at lines 7/15; recheck them, do not assume they remain the only failures. Do not publish with failing release gates.
- [ ] **Step 6:** Obtain whole-branch review, resolve findings with regression tests, and prepare/attach a draft PR with exact scope, fixture evidence, baseline failures, and remaining adoption/live checks. Preserve PR #46 as the promotion dependency; either merge/rebase onto its reviewed change when authorized or identify it clearly in the migration PR. Stage only task files. Record ownership/adoption status and run `python3 /Users/nitrog7/Development/nitrogenx/scripts/sync-architecture-guardrails.py --check`.

## Deferred Live Release and Adoption

This plan ends with reviewed, packaged code and consumer configuration. It does not authorize registry publication or AWS apply.

- [ ] Once release gates are green and a compatible package is authorized, produce a new live read-only plan using the reviewed CLI, descriptor, and a private journal.
- [ ] Present the concrete changes, original deployments, baseline versions, permission statements, and journal summary for authorization covering both stages.
- [ ] Apply only through dev checkpoint, then verify anonymous rejection and authenticated existing/new connections, message delivery, disconnect cleanup, and session expiry with a dedicated dev test account.
- [ ] Resume production routing only after explicit approval of the checkpoint; confirm production aliases still use the recorded baseline.
- [ ] Adopt the validated package in Phantaze with manifest/lockfile agreement. Update its thin deployment adapter/resolver to recognize actual websocket names and invoke `serverless-promote` for the selected stage only after code/configuration updates finish. Verify nonproduction deployment before removing the old path.

## Plan Self-Review

- Manifest/protocol/account/complete-stage checks and in-memory baseline comparison: Tasks 1–2.
- Private journal, schema/digest, local writer lock, safe output: Tasks 2–3 and 6.
- Alias/policy preparation, freeze, variable/URI preservation, deployment readiness, guarded checkpoint: Task 4.
- Uncertain outcomes/resume and recovery after every write: Tasks 4–5.
- Public exports/CLI/documentation, package fixture checks, per-module coverage, whole-suite gates and audit: Tasks 6–7.
- All five Review Focus conditions have named tests in their owning tasks.
- Interfaces are defined before use; no implementation stub or proposed public API is treated as available today.
- Live apply, package release, and adoption remain separately reviewed follow-up work.
