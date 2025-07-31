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
    aiService: require('./lib/utils/aiService.js'),
    app: require('./lib/utils/app.js'),
    file: require('./lib/utils/file.js'),
    log: require('./lib/utils/log.js')
  }
};