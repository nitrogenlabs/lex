/**
 * Lex configuration file
 * This file contains configuration options for the Lex CLI tool
 *
 * Web projects build with Vite. Non-web projects compile with SWC.
 */

export default {
  // Source and output paths
  sourcePath: './src',
  outputPath: './lib',

  // Project settings
  useTypescript: true,
  targetEnvironment: 'web',
  preset: 'web',

  // AI configuration
  // Use this section to configure AI features for lint --fix and ai commands
  ai: {
    // Available providers: 'cursor', 'copilot', 'openai', 'anthropic', 'none'
    provider: 'none',

    // API key for external providers (recommended to use environment variables)
    // apiKey: process.env.OPENAI_API_KEY,

    // Model identifier passed to the selected provider
    model: 'gpt-4o',

    // Optional parameters
    maxTokens: 4000,
    temperature: 0.1
  },

  // Vite configuration for web development and production builds
  vite: {
    base: '/',
    staticPath: './src/static'
  },

  // SWC configuration for non-web compilation and Vite source transforms
  swc: {
    jsc: {
      parser: {
        syntax: 'typescript',
        tsx: true,
        decorators: true,
        dynamicImport: true
      },
      target: 'es2023',
      transform: {
        react: {
          runtime: 'automatic'
        }
      },
      externalHelpers: false,
      keepClassNames: false,
      loose: false
    },
    module: {
      type: 'es6',
      strict: false,
      strictMode: true,
      lazy: false,
      noInterop: false
    },
    minify: false,
    sourceMaps: 'inline',
    inlineSourcesContent: true,
    isModule: true
  },

  // Test configuration
  vitest: {
    dir: './src',
    environment: 'node'
  }
};
