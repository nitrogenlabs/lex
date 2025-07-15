/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */

import type {LexConfigType} from './LexConfig.js';

// Export types from types.ts
export * from './types.js';

// Export classes and values from LexConfig
export {
  defaultConfigValues, LexConfig
} from './LexConfig.js';

// Export Config as both a type and a namespace with create method for backward compatibility
export const Config = {
  create: (config: LexConfigType) => config
};

// Export utility functions
export * from './utils/aiService.js';
export * from './utils/app.js';
export * from './utils/file.js';
export * from './utils/log.js';

// Export commands
export * from './commands/ai/ai.js';
export * from './commands/build/build.js';
export * from './commands/clean/clean.js';
export * from './commands/compile/compile.js';
export * from './commands/config/config.js';
export * from './commands/copy/copy.js';
export * from './commands/create/create.js';
export * from './commands/dev/dev.js';
export * from './commands/init/init.js';
export * from './commands/link/link.js';
export * from './commands/lint/lint.js';
export * from './commands/migrate/migrate.js';
export * from './commands/publish/publish.js';
export * from './commands/storybook/storybook.js';
export * from './commands/test/test.js';
export * from './commands/update/update.js';
export * from './commands/upgrade/upgrade.js';
export * from './commands/versions/versions.js';
