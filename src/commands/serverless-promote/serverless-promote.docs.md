# Serverless promotion command

`lex serverless-promote` publishes the already uploaded and configured Lambda
`$LATEST` as an immutable version, then advances one existing alias. It requires
AWS CLI v2 and its usual credential configuration. It never creates aliases,
changes API Gateway integrations, uploads code, or changes Lambda configuration.

## Usage

```bash
lex serverless-promote --function-name phantazeApiMessageWebsocket --alias dev --region us-east-1 --expected-version 1 --expected-code-sha256 UPLOADED_HASH --expected-revision FINAL_CONFIGURATION_REVISION --dry-run
```

After reviewing the dry run, run the same command without `--dry-run` to promote.
Capture the bundle hash and final configuration revision from the deployment's
AWS responses after code and configuration updates have completed. Capture the
alias's previous version for rollback. Do not derive the expected deployment from
an unrelated `$LATEST` update.

| Option | Description |
| --- | --- |
| `--function-name <name>` | Required unqualified function name. |
| `--alias <name>` | Required existing alias; numeric aliases are rejected. |
| `--region <region>` | Required explicit AWS region. |
| `--expected-version <version>` | Required current alias version. |
| `--expected-code-sha256 <hash>` | Required uploaded bundle hash. |
| `--expected-revision <revision>` | Required final function configuration revision. |
| `--dry-run` | Inspect readiness and baselines without publishing or updating. |
| `--quiet` | Suppress status messages; exit status still reports failure. |

The function must be active with a successful last update. A mismatched alias,
weighted alias, or changed deployment stops promotion. Publishing uses both the
code hash and configuration revision. The command waits for the published
version to become active before updating the alias, using the AWS CLI
`function-active-v2` waiter; a failed or timed-out wait stops promotion. Updating the alias uses its revision to
prevent concurrent changes. Other aliases are never updated. No-op publication
is subject to AWS's rules for unchanged code/configuration and fails rather than
silently selecting an existing version.

If publication succeeds but alias promotion fails, the new version can remain
unreferenced. A network failure can leave the outcome uncertain: inspect the
selected alias before retrying. The command does not automatically roll back or
remove versions. It deliberately omits raw AWS errors and configuration from logs.
Dry runs do not prove write permissions or live application behavior.

Before deploying shared functions, move all callers onto qualified alias/version
ARNs. Callers using unqualified ARNs still invoke `$LATEST`, so changing uploaded
code can affect them before this promotion command runs. Stage migration and
alias-scoped invocation permissions remain separate prerequisites.

## Programmatic API

```typescript
import {serverlessPromote} from '@nlabs/lex';

await serverlessPromote({
  alias: 'dev',
  dryRun: true,
  expectedCodeSha256: 'UPLOADED_HASH',
  expectedRevision: 'FINAL_CONFIGURATION_REVISION',
  expectedVersion: '1',
  functionName: 'phantazeApiMessageWebsocket',
  region: 'us-east-1'
});
```

The ESM export returns `0` on success and `1` on failure and accepts an optional
exit-status callback. This capability is not exposed by Lex's legacy CommonJS
entry point.
