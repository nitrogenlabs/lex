# Websocket stage migration in Lex

Date: October 5, 2026. Status: proposed specification for user review.

## Outcome and constraints

Move Phantaze's existing websocket stages onto separate Lambda aliases while
preserving their current code and configuration. Subsequent dev deployments must
advance only dev aliases. Lex owns CLI orchestration; application resource names
and route bindings remain consumer configuration. Reaktor provisioning currently
exposes app/build configuration contracts, not an AWS stage migration capability.
Use the AWS CLI already required by Lex's promotion command; add no AWS SDK or
second deployment stack.

This migration creates baseline aliases and invocation permissions and changes
API Gateway routing. It does not upload new code, change Lambda environment
variables, promote a new application version, alter domains, or publish packages.
Live execution requires a separately reviewed plan and authorization for both
stages, including production routing changes.

## Evidence and selected approach

The October 5 read-only audit confirms API `wrql5l5q3l` in `us-east-1`, account
`193018249461`, has exactly `dev` and `prod`, both using deployment `outf7t`, with
auto-deploy enabled and empty stage variables. Each function has only the `live`
alias at version `1`. Its inspected versioned configuration and code hash match
`$LATEST`. Existing integrations invoke unqualified functions.

| Route | Integration | Function | Baseline version |
| --- | --- | --- | --- |
| `$connect` | `w0wh6q8` | `phantazeApiConnectionWebsocket` | `1` |
| `$disconnect` | `kx4i5h6` | `phantazeApiConnectionWebsocket` | `1` |
| `$default` | `z1tjlp5` | `phantazeApiDefaultWebsocket` | `1` |
| `reaktorMessage` | `ch0m982` | `phantazeApiMessageWebsocket` | `1` |

Use one stage variable, `websocketAlias`, with values `dev` and `prod`. Keep the
same API, domains, routes, and function names. Each integration URI gains
`:${stageVariables.websocketAlias}` after its unqualified function name.
AWS supports this alias substitution and requires invocation permissions to be
configured explicitly. See [websocket stage variables](https://docs.aws.amazon.com/apigateway/latest/developerguide/websocket-api-stages.html).

Alternatives considered: separate websocket APIs offer stronger resource
isolation but require domain/client migration; cloning functions for each stage
requires more resource lifecycle management and still needs API routing changes.
Aliases fit the existing deployment and the reviewed promotion command.

## Public command and consumer configuration

Add `lex serverless-stages` with `--manifest <path>`, `--mode plan|apply|rollback`,
`--journal <path>`, `--resume-production`, and `--quiet`; default mode is `plan`. Expose an equivalent
ESM function returning the normal Lex exit status. Do not change CommonJS exports.
Keep it separate from `serverless-promote` so baseline migration cannot publish
application code or advance release aliases.

The versioned JSON manifest contains `schemaVersion: 1`, `accountId`, `apiId`,
`region`, `stageVariable`, `stages` (stage name, alias, rollout order), and
`bindings` (route key, integration ID, unqualified function name, baseline
version). For Phantaze, dev is first and prod second; bindings are the table above.
Do not accept executable hooks, credentials, environment values, wildcard stage
names, unqualified baseline versions, or cross-account functions.

The manifest must name every stage on this API. Route bindings must match the
current route-to-integration-to-function mapping exactly. Duplicate route keys,
conflicting shared integration bindings, duplicate stage names, numeric aliases,
unsupported protocols/integration types, integration credentials roles, and
pre-existing unrelated qualifications are rejected. Restrict this first version
to same-account AWS_PROXY Lambda integrations using the standard invocation URI.
Unselected routes are preserved; selected integrations may not be referenced by
an unselected route. API routes/settings beyond the selected URIs are unchanged.

Phantaze stores only this resource manifest in its repository. The installed and
locked Lex version must support the command before workflow adoption; a local
manifest version or proposed package export is not evidence of a published API.

## Plan and preflight

Plan mode performs reads only, using paginated AWS CLI operations. Verify STS
account identity, API protocol, complete stage inventory, route targets,
integration URIs/settings, stage deployment IDs, auto-deploy states, stage
variables, functions, published versions, aliases, and qualified resource policies.
Resource-not-found is distinguished from access denied and transport failures.

Every baseline version must exist and be active. Compare its code hash and
versioned configuration to current `$LATEST` in memory, including environment,
handler, runtime, role, memory, timeout, architecture, layers, VPC, ephemeral
storage, dead-letter/tracing/logging/filesystem settings, KMS key, image settings,
and SnapStart ApplyOn. Exclude response metadata and runtime-derived status fields.
Reject mismatches rather than publish or choose another baseline automatically.
Never print or persist Lambda environment values. Record only code hashes and
revision identifiers for the baseline guard.

A requested alias may be absent or already point entirely to the baseline.
Weighted routing or a different version is a conflict. Preserve unrelated aliases
and policy statements. Permission IDs are deterministic from API/stage/route;
an existing ID is reusable only if its complete permission semantics match.

Write an exclusive, schema-versioned journal with mode `0600`, refusing an
existing file and symlink targets. It contains resource identity, original
integration URIs, stage deployment IDs/variables/auto-deploy settings, expected
baseline revisions, intended changes, and progress. Existing stage variable values
stay in this private journal and are not printed. Print only a concise change
summary and journal location. Keep journals outside tracked source and never
include credentials or raw AWS command output.

## Apply ordering and guards

Apply consumes the journal and the identical manifest. Reread all preflight
resources and reject drift before any write. API Gateway exposes no general
compare-and-swap revision for these updates: require an exclusive operator window
with other API/configuration writers paused. Reread touched resources before each
write; do not describe this as an atomic transaction or race-free deployment.

1. Create missing stage aliases at the existing baseline version. Reuse matching
   aliases. Wait for baseline readiness and confirm all alias targets before
   touching routing.
2. Add eight Phantaze alias-qualified invocation statements: four routes across
   two stages. Use principal `apigateway.amazonaws.com`, action
   `lambda:InvokeFunction`, qualifier equal to the stage alias, source account
   equal to the manifest account, and source ARN
   `arn:aws:execute-api:<region>:<account>:<api>/<stage>/<routeKey>`.
   The connection alias receives separate connect/disconnect statements. Apply
   policy revision guards where available; reread between additions. Never grant
   wildcard-stage access. See [Lambda AddPermission](https://docs.aws.amazon.com/lambda/latest/api/API_AddPermission.html).
3. Disable auto-deploy on every named stage, retaining each current deployment
   ID. Verify the freeze before changing integration URIs. An unsuccessful freeze
   stops before any URI change; record prior successful writes for recovery.
4. Merge the alias stage variable into each existing map, preserving other keys.
   A conflicting existing value is rejected during preflight; a matching value
   is reusable. Write only the intended stage fields.
5. Update the selected integration URIs, preserving all other integration fields.
   All aliases still target the baseline. Verify the entire intended API config
   and unchanged route/authorization mappings before taking a deployment snapshot.
6. Create one deployment of the verified API configuration and poll until deployed
   (bounded timeout; failed status stops). Associate it with dev first, then
   confirm its stage variable, deployment, alias targets, and invocation policy.
   Require an operator dev-check checkpoint before associating it with prod;
   resuming apply uses the same journal and rereads the expected intermediate
   state. Applying the journal again without `--resume-production` only verifies
   the checkpoint and reports it. Reject `--resume-production` outside the dev
   checkpoint and require the operator to attest that dev checks passed.
   At the checkpoint the command exits successfully with a clearly
   reported pending-production status; it must not claim migration complete.
7. Associate the same deployment with prod only on explicit resume of the
   reviewed journal with `--resume-production`, confirm all metadata, then restore each original auto-deploy
   setting. Verify effective configuration after any AWS-generated deployment
   change and mark the journal complete only after both stages pass.

Stage deployment updates require auto-deploy to be disabled. See
[UpdateStage](https://docs.aws.amazon.com/cli/latest/reference/apigatewayv2/update-stage.html)
and [websocket deployment](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-set-up-websocket-deployment.html).
Existing connections may observe the routing transition; the operator checks
must include an existing connection and a new connection in dev. The implementation
must not promise uninterrupted traffic from metadata checks alone.

## Failure, resume, and rollback

Journal intent before each mutation and confirm it with a read afterward. Write
journal updates atomically with restricted permissions. If command output is
uncertain, stop and reconcile the actual resource before another mutation.
Sanitize failures to operation/resource identifiers; never log raw AWS errors.

Resume accepts only resource state matching the recorded original, confirmed
intermediate, or intended final state; other drift stops for operator review.
Do not overwrite differing aliases, permissions, stage variables, or integrations
on retry. Do not automatically delete aliases or versions.

Rollback first freezes auto-deploy, then restores each recorded stage deployment
ID so it invokes the original configuration, restores original integration URIs
in the API working configuration, and restores the original stage-variable maps.
Verify the restored configuration before restoring original auto-deploy modes.
Refuse unexpected intervening resource changes instead of overwriting another
operator's work. Keep created aliases and permissions as documented inert
resources; never delete potentially referenced resources automatically.

Rollback requires the original deployment snapshots to remain available. Preflight
and resume verify their existence; unavailable snapshots stop with an explicit
manual recovery requirement. A partially completed rollback remains recorded.
Restoring auto-deploy can change deployment IDs; require equivalent original
routing/configuration, not permanent equality of an AWS-generated ID.

## Verification and release gates

Use Vitest in Lex for validation, discovery pagination, baseline comparison,
permission semantics, mutation ordering, dry-run read-only behavior, drift,
resume, and rollback. Exercise failure after every write, ambiguous outcomes,
permission conflicts, access denied, weighted aliases, extra stages/routes,
failed deployments, unavailable snapshots, and preservation of unrelated fields.
Every new implementation module must meet at least 90% coverage in all metrics.

Use Playwright CLI fixtures with a controlled AWS executable for plan, apply to
the dev checkpoint, explicit resume through prod, rollback, and idempotent resume.
Run the packaged CLI and public ESM export against Phantaze's consumer descriptor.
Run build/declarations, full lint without warnings, documentation validation,
full tests, and test typecheck. Record existing Vitest/PostCSS gate failures
separately; do not weaken tests or publish while release gates remain red.

After implementation/review, produce a fresh live read-only plan for both stages.
Only then seek authorization to apply that concrete plan. Check anonymous
connection rejection and authenticated new/existing connections, message delivery,
disconnect cleanup, and session expiry in dev before the prod routing checkpoint.
Authenticated checks need a dedicated dev test account; automated fixtures do not
substitute for live behavior. Release/adopt a validated Lex version, then wire
Phantaze's deployment to upload/configure and call `serverless-promote` for dev
only, preserving the recorded production baseline.
