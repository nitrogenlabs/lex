/**
 * Root-level Lex configuration file
 */
export default {
  // Source and output paths
  sourcePath: './src',
  outputPath: './dist',

  // Project settings
  name: 'lex',
  useTypescript: true,

  // Copy files configuration - patterns are now relative to sourcePath
  copyFiles: [],

  // AI configuration for linting and code generation
  ai: {
    // AI provider options: 'cursor', 'openai', 'anthropic', 'copilot'
    provider: 'cursor',

    // Model to use (provider-specific)
    model: 'cursor-code',

    // API key (not needed for Cursor)
    // This can also be set via environment variables:
    // - Generic: AI_API_KEY
    // - Provider-specific: OPENAI_API_KEY, ANTHROPIC_API_KEY, GITHUB_TOKEN (for Copilot)
    // apiKey: 'your-api-key',

    // You can customize these settings based on your preferences
    maxTokens: 4000,
    temperature: 0.1
  }
};