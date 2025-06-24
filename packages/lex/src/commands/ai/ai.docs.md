# AI Module API Documentation

The AI module provides artificial intelligence assistance for Lex projects, supporting multiple AI providers and task types.

## API

### `ai(options: AIOptions): Promise<number>`

The main function that handles AI request execution with various configuration options.

#### Parameters

- `options`: An object containing the AI configuration options
  - `cliName?: string` - Custom name for the CLI tool in output messages (defaults to "Lex")
  - `context?: boolean` - Whether to include project context in the AI prompt
  - `file?: string` - Path to a file to provide as context
  - `lexConfig?: string` - Path to a custom Lex configuration file
  - `model?: string` - Override the AI model specified in config
  - `prompt?: string` - The text prompt to send to the AI
  - `quiet?: boolean` - Whether to suppress output except for errors
  - `task?: 'generate' | 'explain' | 'test' | 'optimize' | 'help'` - The type of task to perform

#### Returns

- `Promise<number>`: A promise that resolves to the exit code (0 for success, 1 for failure)

## Interfaces

### `AIOptions`

```typescript
export interface AIOptions {
  readonly cliName?: string;
  readonly context?: boolean;
  readonly file?: string;
  readonly lexConfig?: string;
  readonly model?: string;
  readonly prompt?: string;
  readonly quiet?: boolean;
  readonly task?: 'generate' | 'explain' | 'test' | 'optimize' | 'help';
}
```

## Helper Functions

### `getFileContext(filePath: string): string`

Extracts context from a specific file.

#### Parameters

- `filePath`: Path to the file to extract context from

#### Returns

- `string`: The file content with its path as context

### `getProjectContext(options: AIOptions): Promise<string>`

Gets context from the project based on the task.

#### Parameters

- `options`: The AI options

#### Returns

- `Promise<string>`: The project context as a string

### `constructPrompt(options: AIOptions, projectContext: string): string`

Constructs the prompt to send to the AI model.

#### Parameters

- `options`: The AI options
- `projectContext`: The project context

#### Returns

- `string`: The constructed prompt

### `displayResponse(response: any, options: AIOptions): void`

Displays the AI response based on the task.

#### Parameters

- `response`: The response from the AI model
- `options`: The AI options

### `getProviderAuth(provider: string): string | undefined`

Gets the appropriate API key or authentication for the selected provider.

#### Parameters

- `provider`: The AI provider name

#### Returns

- `string | undefined`: The API key or authentication token

## Features

- **Multiple AI Providers**: Supports OpenAI, Anthropic, Cursor, and GitHub Copilot.
- **Task Types**: Specialized prompts for code generation, explanation, testing, and optimization.
- **Project Context**: Automatically includes relevant project context based on the task.
- **File Context**: Can include specific file content as context for the AI.
- **Environment Variables**: Supports multiple authentication methods via environment variables.
- **Configuration**: Configurable via lex.config.js or command-line options.

## Usage

```bash
lex ai [options]
```

## Integration

The AI module is also used by other Lex commands:

- **Lint**: The `lint` command uses AI to fix linting errors when the `--fix` flag is used.
- **Build**: The `build` command can use AI to assist with build errors and optimization.

## Provider-Specific Behavior

Each AI provider has specific behavior and requirements:

### OpenAI

- Requires an API key via `OPENAI_API_KEY` environment variable or `ai.apiKey` in config
- Supports various models like `gpt-4o`, `gpt-4`, and `gpt-3.5-turbo`
- Uses the OpenAI Chat Completions API

### Anthropic

- Requires an API key via `ANTHROPIC_API_KEY` environment variable or `ai.apiKey` in config
- Supports models like `claude-3-opus` and `claude-3-sonnet`
- Uses the Anthropic API

### Cursor

- No API key required when running in Cursor IDE
- Uses Cursor's built-in AI capabilities
- Best for code-specific tasks

### GitHub Copilot

- Requires a GitHub token via `GITHUB_TOKEN` environment variable
- Uses GitHub Copilot API
- Good for code generation and explanation

## Environment Variables

The module checks for the following environment variables:

- `AI_API_KEY`: Generic API key that works across providers
- `OPENAI_API_KEY`: OpenAI-specific API key
- `ANTHROPIC_API_KEY`: Anthropic-specific API key
- `GITHUB_TOKEN`: GitHub token for Copilot access
- `CURSOR_IDE`: Flag to indicate running in Cursor IDE