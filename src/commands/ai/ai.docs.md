# AI command

`lex ai` sends a development prompt through the AI provider configured in `lex.config.js`.

## Usage

```bash
lex ai --task generate --prompt "Create a React component"
lex ai --task explain --file src/App.tsx --prompt "Explain this component"
lex ai --task optimize --prompt "Review the Vite build configuration"
```

## CLI options

| Option | Default | Description |
|--------|---------|-------------|
| `--context` | `true` | Include file or project context. |
| `--file <path>` | — | File or glob to include as context. |
| `--lexConfig <path>` | — | Lex configuration file to load. |
| `--model <model>` | Configured provider default | Override `ai.model`. |
| `--prompt <text>` | — | Prompt sent to the provider. Required for useful output. |
| `--quiet` | `false` | Suppress Lex status output. |
| `--task <task>` | `help` | `generate`, `explain`, `test`, `optimize`, or `help`. |

The programmatic API also accepts `analyze` and `ask` tasks plus `provider` and `dir` overrides.

## Configuration

```javascript
export default {
  ai: {
    apiKey: process.env.OPENAI_API_KEY,
    maxTokens: 4000,
    model: 'gpt-4o',
    provider: 'openai',
    temperature: 0.1
  }
};
```

Supported providers are `openai`, `anthropic`, `cursor`, `copilot`, and `none`. OpenAI reads `OPENAI_API_KEY`; Anthropic reads `ANTHROPIC_API_KEY`. Cursor and Copilot currently provide limited CLI integrations rather than full editor capabilities.

## Programmatic API

```typescript
import {aiFunction} from '@nlabs/lex';

const result = await aiFunction({
  file: 'src/App.tsx',
  prompt: 'Explain this component',
  task: 'explain'
});
```

`aiFunction(options)` resolves to `{response}` on success or `{error}` on failure. It does not return a process exit code.
