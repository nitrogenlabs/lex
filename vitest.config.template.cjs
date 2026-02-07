/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */

// Read Vitest config from LEX_CONFIG environment variable if available
let lexConfig = null;
if(process.env.LEX_CONFIG) {
  try {
    lexConfig = JSON.parse(process.env.LEX_CONFIG);
  } catch(error) {
    console.warn('Failed to parse LEX_CONFIG:', error.message);
  }
}

const setupFile = process.env.LEX_VITEST_SETUP || '<rootDir>/vitest.setup.js';

const baseConfig = {
  resolve: {
    alias: [
      {
        find: /^(\.{1,2}\/.*)\.js$/,
        replacement: '$1'
      },
      {
        find: /\.(css|less|scss|sass)$/,
        replacement: 'identity-obj-proxy'
      },
      {
        find: /\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$/,
        replacement: '<rootDir>/__mocks__/fileMock.js'
      }
    ]
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.{test,spec,integration}.{ts,tsx,js,jsx}'],
    setupFiles: [setupFile],
    coverage: {
      provider: 'v8',
      reportsDirectory: '<rootDir>/coverage',
      reporter: ['html', 'text'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/lib/**',
        '**/__snapshots__/**',
        '**/*.d.ts'
      ]
    }
  }
};

// Merge with Lex config if available
if(lexConfig && lexConfig.vitest) {
  module.exports = {
    ...baseConfig,
    test: {
      ...baseConfig.test,
      ...lexConfig.vitest
    }
  };
} else {
  module.exports = baseConfig;
}
