/**
 * CommonJS entry point for @nlabs/lex
 */

// This file provides CommonJS compatibility for projects using require()
module.exports = {
  // Export Config as both a type and a namespace with create method for backward compatibility
  Config: {
    create: (config) => config
  },
  // Export LexConfig class
  LexConfig: require('./dist/LexConfig.js').LexConfig,
  // Export utility functions
  utils: {
    aiService: require('./dist/utils/aiService.js'),
    app: require('./dist/utils/app.js'),
    file: require('./dist/utils/file.js'),
    log: require('./dist/utils/log.js')
  }
};