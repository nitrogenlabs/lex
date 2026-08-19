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
