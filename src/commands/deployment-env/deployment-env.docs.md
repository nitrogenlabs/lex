# deployment-env

`lex deployment-env <validate|setup> --descriptor <path> [--stage <stage|all>] [--env-file <path>] [--repo <owner/name>] [--dry-run] [--quiet]`

The schemaVersion 1 JSON descriptor contains setting names, variable defaults and stage/environment mappings, never secret values. Setup defaults to all stages and prevalidates all before any subprocess. Validate requires one stage from the option or agreeing DEPLOY_STAGE/stage/STAGE aliases. Validate uses unprefixed explicit file then process values without defaults; setup uses stage-prefixed file, stage-prefixed process, file, process, default in truthy order. Required whitespace fails; optional whitespace is omitted.

Only an explicitly supplied env-file is read. Simple dotenv supports LF/CRLF, last duplicate key, equals and spaces, and independent leading/trailing quote stripping. No expansion, export, multiline or inline-comment parsing occurs. Wrappers resolve descriptors from their module URL; env-file paths resolve from caller cwd.

Setup chooses repository override, descriptor, then gh discovery. Offline dry-run requires an override or descriptor repository and invokes no subprocess. Secrets go to gh stdin, variables retain exact bytes in argv. Captured child output/errors are discarded; partial failure reports completed/pending targets without rollback. No retry occurs.

Local fake-gh tests establish command boundaries; they do not establish cloud authorization or live environment deployment. Local archives require a compatible package release before registry adoption.
