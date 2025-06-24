# AI Command

The AI command provides artificial intelligence assistance for your development workflow using the Lex CLI.

## Configuration

AI features are configured in your `lex.config.js` file. Add an `ai` section to your configuration:

```js
export default {
  // Other Lex configuration...
  
  // AI configuration
  ai: {
    // Required: AI provider to use
    // Available options: 'openai', 'anthropic', 'cursor', 'copilot', 'none'
    provider: 'openai',
    
    // Required for external providers: API key 
    // Recommended to use environment variables
    apiKey: process.env.OPENAI_API_KEY,
    
    // Optional: Model to use (provider-specific)
    // Examples:
    // - OpenAI: 'gpt-4o', 'gpt-4', 'gpt-3.5-turbo'
    // - Anthropic: 'claude-3-opus', 'claude-3-sonnet'
    model: 'gpt-4o',
    
    // Optional: Maximum tokens for AI responses
    maxTokens: 4000,
    
    // Optional: Temperature for AI responses (0.0-1.0)
    // Lower values produce more deterministic outputs
    // Higher values produce more creative outputs
    temperature: 0.1
  }
};
```

## Usage

The AI command can be used for various tasks:

```bash
# Get help with a development question
lex ai --prompt "How do I implement a React context provider?"

# Generate code
lex ai --task generate --prompt "Create a React component for a user profile"

# Explain code in a file
lex ai --task explain --file src/components/Button.tsx

# Generate tests for a file
lex ai --task test --file src/utils/formatting.ts

# Optimize code
lex ai --task optimize --file src/app.tsx
```

## Options

- `--prompt`: The text prompt to send to the AI
- `--task`: The task type (generate, explain, test, optimize, help)
- `--file`: Path to a file for context
- `--model`: Override the AI model specified in config
- `--context`: Enable/disable project context (default: true)

## Related Features

The `lex lint --fix` command also uses the AI configuration to fix linting errors that can't be automatically fixed by ESLint rules.