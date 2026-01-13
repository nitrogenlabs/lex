/**
 * Lex configuration file
 * This file contains configuration options for the Lex CLI tool
 *
 * Note: SWC has replaced esbuild as the default transpiler.
 * The 'swc' configuration section below replaces the old 'esbuild' configuration.
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

  // SWC configuration (replaces esbuild)
  // SWC is now the default transpiler for all TypeScript/JavaScript compilation
  swc: {
    jsc: {
      parser: {
        syntax: 'typescript',
        tsx: true,
        decorators: true,
        dynamicImport: true
      },
      target: 'es2020',
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
  jest: {
    roots: ['<rootDir>/src'],
    testEnvironment: 'node'
  },

  // Tailwind CSS content paths
  // Specify which files Tailwind should scan for class names
  // This is used by the PostCSS Tailwind plugin during build
  tailwindContent: [
    './src/**/*.{js,ts,jsx,tsx}',
    // Include external packages that use Tailwind classes
    // './node_modules/@nlabs/gothamjs/lib/**/*.{js,ts,jsx,tsx}'
  ]
};