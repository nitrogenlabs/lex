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

  // Webpack configuration
  webpack: {
    // Path to static assets directory (defaults to './src/static')
    staticPath: './src/static',

    // Other webpack configuration options
    devtool: 'source-map',
    plugins: []
  },

  // SWC configuration (replaces esbuild)
  // SWC is now the default transpiler for all TypeScript/JavaScript compilation
  swc: {
    // JavaScript Compiler (JSC) configuration
    jsc: {
      // Parser configuration
      parser: {
        syntax: 'typescript', // 'typescript' or 'ecmascript'
        tsx: true, // Enable TSX support for React components
        decorators: true, // Enable TypeScript decorators
        dynamicImport: true // Enable dynamic imports
      },

      // Target JavaScript version
      target: 'es2020', // 'es3', 'es5', 'es2015', 'es2016', 'es2017', 'es2018', 'es2019', 'es2020', 'es2021', 'es2022', 'es2023'

      // Transform configuration
      transform: {
        react: {
          runtime: 'automatic', // 'automatic' or 'classic'
          // pragma: 'React.createElement', // For classic runtime
          // pragmaFrag: 'React.Fragment', // For classic runtime
          throwIfNamespace: false,
          development: false,
          useBuiltins: false,
          refresh: false
        }
      },

      // Additional JSC options
      externalHelpers: false, // Use external helpers
      keepClassNames: false, // Keep class names
      loose: false // Use loose mode
    },

    // Module configuration
    module: {
      type: 'es6', // 'es6', 'commonjs', 'amd', 'umd', 'systemjs'
      strict: false, // Use strict mode
      strictMode: true, // Use strict mode
      lazy: false, // Lazy loading
      noInterop: false // No interop
    },

    // Build options
    minify: false, // Enable minification
    sourceMaps: 'inline', // 'inline', true, false
    inlineSourcesContent: true, // Inline source content
    isModule: true // Treat as module

    // Environment configuration (optional)
    // env: {
    //   targets: 'node >= 18', // Browser targets or Node.js version
    //   mode: 'usage', // 'usage' or 'entry'
    //   coreJs: '3', // Core-js version
    //   debug: false, // Debug mode
    //   dynamicImport: true, // Dynamic imports
    //   loose: false, // Loose mode
    //   bugfixes: false, // Bug fixes
    //   include: [], // Include specific features
    //   exclude: [], // Exclude specific features
    //   forceAllTransforms: false, // Force all transforms
    //   modules: 'auto', // Module format
    //   shippedProposals: false // Shipped proposals
    // }
  },

  // Test configuration
  vitest: {
    dir: './src',
    environment: 'node'
  }
};

// Example: Minimal SWC configuration
// export default {
//   useTypescript: true,
//   swc: {
//     jsc: {
//       target: 'es2020',
//       parser: {
//         syntax: 'typescript',
//         tsx: true
//       }
//     }
//   }
// };

// Example: Production SWC configuration with minification
// export default {
//   useTypescript: true,
//   swc: {
//     jsc: {
//       target: 'es2020',
//       parser: {
//         syntax: 'typescript',
//         tsx: true,
//         decorators: true
//       },
//       transform: {
//         react: {
//           runtime: 'automatic'
//         }
//       }
//     },
//     module: {
//       type: 'es6'
//     },
//     minify: true,
//     sourceMaps: true
//   }
// };
