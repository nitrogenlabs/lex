/**
 * Lex configuration file
 * This file contains configuration options for the Lex CLI tool
 */

export default {
  // Source and output paths
  sourcePath: './src',
  outputPath: './dist',
  
  // Project settings
  useTypescript: true,
  targetEnvironment: 'web',
  preset: 'web',
  
  // AI configuration
  // Use this section to configure AI features for lint --fix and ai commands
  ai: {
    // Available providers: 'cursor', 'copilot', 'openai', 'anthropic', 'none'
    provider: 'cursor',
    
    // API key for external providers (recommended to use environment variables)
    // apiKey: process.env.OPENAI_API_KEY,
    
    // Model configuration (specific to each provider)
    model: 'cursor-code', // For Cursor IDE
    // model: 'copilot-codex', // For GitHub Copilot
    // model: 'gpt-4o', // For OpenAI
    // model: 'claude-3-sonnet', // For Anthropic
    
    // Optional parameters
    maxTokens: 4000,
    temperature: 0.1
  },
  
  // Build configuration
  esbuild: {
    entryPoints: ['src/index.ts'],
    outdir: 'dist',
    platform: 'node',
    target: 'es2020',
    format: 'esm'
  },
  
  // Test configuration
  jest: {
    roots: ['<rootDir>/src'],
    testEnvironment: 'node'
  }
}; 