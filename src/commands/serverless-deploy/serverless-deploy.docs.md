# Serverless deploy command

`lex serverless-deploy` bundles one AWS Lambda entry with esbuild, assembles a package directory, optionally copies runtime dependencies, and creates a zip archive.

## Usage

```bash
lex serverless-deploy --entry src/handlers/api.ts
lex serverless-deploy --entry src/handlers/api.ts --minify --sourcemap
lex serverless-deploy --entry src/handlers/api.ts --external @aws-sdk/*
lex serverless-deploy --entry src/handlers/api.ts --copyNodeModule sharp
```

`--entry` is required at runtime.

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `--entry <path>` | — | Lambda entry file to bundle. |
| `--copyNodeModule <value...>` | — | Runtime packages copied after bundling. |
| `--external <value...>` | — | Package names or patterns left external. |
| `--format <value>` | `cjs` | Output format: `cjs` or `esm`. |
| `--mainFields <value>` | `module,main` | Package fields preferred by esbuild. |
| `--minify` | `false` | Minify the bundle. |
| `--nodeModulesPath <path>` | `./node_modules` | Source for copied runtime packages. |
| `--outfile <path>` | `<packageDir>/index.js` | Bundle path inside the package directory. |
| `--output <path>` | `./lambda-package.zip` | Final zip archive. |
| `--packageDir <path>` | `./.lex/lambda-package` | Staging directory. |
| `--quiet` | `false` | Suppress Lex status output. |
| `--sourcemap` | `false` | Generate a source map. |
| `--target <value>` | `node24` | esbuild runtime target. |

## Programmatic API

```typescript
import {serverlessDeploy} from '@nlabs/lex';

await serverlessDeploy({
  entry: 'src/handlers/api.ts',
  external: ['@aws-sdk/*'],
  minify: true,
  output: 'dist/api.zip'
});
```

The programmatic `ServerlessDeployOptions` interface additionally exposes `bundle`, `cliName`, and `platform`. The command resolves all paths from the current working directory and replaces the selected staging directory and output archive during each run.

## Locked runtime dependencies and pre-archive smoke

The existing bundler can stage exact runtime dependencies through `npm ci`. This consumes a version3 source package lock and installed direct package metadata from the supplied resolution context. It preserves locked transitive versions/integrities through Lex's shared runtime-lock utility. The source lock and installed source packages are never modified. Runtime packages and their subpaths are automatically externalized from esbuild to keep the isolated runtime separate.

| Option | Description |
|--------|-------------|
| `--runtimeDependencies <value...>` | Direct runtime package names, such as arangojs graphql sharp. |
| `--runtimeContext <path>` | File used for Node package resolution (for example api/package.json or a resolved Reaktor entry). |
| `--runtimeLockfile <path>` | Exact source npm version3 lockfile. |
| `--runtimePlatform <value>` | Explicit npm/native operating system, such as linux. Distinct from the esbuild `platform: 'node'` option. |
| `--runtimeArchitecture <value>` | Explicit npm/native CPU, such as x64 or arm64. |
| `--smokeCommand <value>` | Executable invoked inside the isolated staging directory before ZIP creation. |
| `--smokeArgs <value...>` | Structured executable arguments, passed without shell interpretation. |

Runtime dependency mode requires context, lockfile, platform, architecture and smoke command. It cannot be mixed with `copyNodeModule`, which could overwrite the locked dependency graph. The declared platform/architecture must match the actual executor host; macOS packaging cannot certify Linux native modules. Use an already prepared matching Linux build environment for Linux Lambda artifacts.

Installation runs `npm ci --omit=dev --include=optional --ignore-scripts --workspaces=false --os=<platform> --cpu=<architecture>` in staging, with matching npm platform/architecture environment variables. Lifecycle scripts are disabled; dependencies needing compilation must have a separately supported preparation, and unusable modules must fail the isolated smoke. The generated manifest's module type follows the selected CommonJS/ESM format. No successful archive is reported before smoke passes. Build/install/smoke/ZIP failure returns 1, suppresses opaque subprocess output, and removes a partially created ZIP.

```typescript
await serverlessDeploy({
  entry: 'api/src/index.ts',
  runtimeArchitecture: 'x64',
  runtimeContext: 'api/package.json',
  runtimeDependencies: ['arangojs', 'graphql', 'sharp'],
  runtimeLockfile: 'package-lock.json',
  runtimePlatform: 'linux',
  smokeArgs: ['/absolute/app/deployment/api-package-smoke.mjs'],
  smokeCommand: process.execPath
});
```

App smoke files own domain checks. Phantaze checks its six named handlers and custom schema initialization; UrbanX checks health and the GraphQL stage field. Lex does not contain either app's schema/query logic. A smoke executable must reject failure with a nonzero status; Lex captures its output rather than printing potential credentials.

The API accepts a third `ServerlessDeployDependencies` argument for structured `run(command, args, {cwd, env?, stdio})` execution and observed host platform/architecture. This supports deterministic fixtures and explicitly supplied matched-platform executors; observations must describe the executor truthfully. Test injection does not certify a native runtime.

Path validation precedes staging deletion. Staging cannot contain the caller cwd, entry, runtime context/lock, home/temp root, or filesystem root; it cannot target `.git` or declared node_modules. A staging symlink, escaping outfile, archive inside staging, source/output overlap, copied-module traversal or copied-source/staging overlap is rejected. Output archives must end in `.zip`. Existing safe staging remains inspectable after failure; partial archives are removed. These protections intentionally refuse previously destructive combinations.
