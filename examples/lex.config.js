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
  ai: {
    // Available providers: 'cursor', 'copilot', 'openai', 'anthropic', 'none'
    provider: 'cursor',
    
    // Model configuration (specific to each provider)
    model: 'cursor-code', // For Cursor IDE
    // model: 'copilot-codex', // For GitHub Copilot
    // model: 'gpt-4o', // For OpenAI
    
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