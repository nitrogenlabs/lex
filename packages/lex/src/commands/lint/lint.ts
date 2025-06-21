/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import {existsSync, writeFileSync, readFileSync, unlinkSync} from 'fs';
import {resolve as pathResolve, dirname} from 'path';
import {fileURLToPath} from 'url';

import {createSpinner} from '../../utils/app.js';
import {log} from '../../utils/log.js';

// Create __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface LintOptions {
  readonly cache?: boolean;
  readonly cacheFile?: string;
  readonly cacheLocation?: string;
  readonly cliName?: string;
  readonly color?: boolean;
  readonly config?: string;
  readonly debug?: boolean;
  readonly env?: string;
  readonly envInfo?: boolean;
  readonly ext?: string;
  readonly fix?: boolean;
  readonly fixDryRun?: boolean;
  readonly fixType?: string;
  readonly format?: string;
  readonly global?: string;
  readonly ignorePath?: string;
  readonly ignorePattern?: string;
  readonly init?: boolean;
  readonly maxWarnings?: string;
  readonly noColor?: boolean;
  readonly noEslintrc?: boolean;
  readonly noIgnore?: boolean;
  readonly noInlineConfig?: boolean;
  readonly outputFile?: string;
  readonly parser?: string;
  readonly parserOptions?: string;
  readonly plugin?: string;
  readonly printConfig?: string;
  readonly quiet?: boolean;
  readonly reportUnusedDisableDirectives?: boolean;
  readonly resolvePluginsRelativeTo?: string;
  readonly rule?: string;
  readonly rulesdir?: string;
  readonly stdin?: boolean;
  readonly stdinFilename?: string;
  readonly aifix?: boolean;
}

export type LintCallback = typeof process.exit;

interface ConfigResult {
  configPath: string;
  originalConfig: string | null;
}

/**
 * Create a temporary ESLint config file
 */
const createDefaultESLintConfig = (useTypescript: boolean, cwd: string): ConfigResult => {
  // Create a flat config file for ESLint 9.x
  const configPath = pathResolve(cwd, 'eslint.config.js');

  // Save the original config if it exists
  let originalConfig = null;
  if(existsSync(configPath)) {
    try {
      originalConfig = readFileSync(configPath, 'utf8');
    } catch(_error) {
      // Ignore errors
    }
  }

  // Try to find Lex's eslint.config.js to copy
  // Try different potential locations for the Lex config
  const possiblePaths = [
    // From src/commands/lint/lint.ts to root
    pathResolve(__dirname, '../../../../eslint.config.js'),
    // From packages/lex/src/commands/lint/lint.ts to packages/lex
    pathResolve(__dirname, '../../../eslint.config.js'),
    // From packages/lex/src/commands/lint/lint.ts to root
    pathResolve(__dirname, '../../../../../eslint.config.js'),
    // Absolute path if Lex is installed globally
    pathResolve(process.env.LEX_HOME || '/usr/local/lib/node_modules/@nlabs/lex', 'eslint.config.js')
  ];

  let foundConfig = '';
  for(const path of possiblePaths) {
    if(existsSync(path)) {
      foundConfig = path;
      break;
    }
  }

  let eslintConfig;

  if(foundConfig) {
    // Copy Lex's config file
    try {
      eslintConfig = readFileSync(foundConfig, 'utf8');
    } catch(_error) {
      // Fall back to default config if we can't read Lex's config
      eslintConfig = createBasicESLintConfig(useTypescript);
    }
  } else {
    // Create a simple config if Lex's config doesn't exist
    eslintConfig = createBasicESLintConfig(useTypescript);
  }

  // Write the config
  writeFileSync(configPath, eslintConfig, 'utf8');

  // Return both the config path and the original config
  return {
    configPath,
    originalConfig
  };
};

/**
 * Create a basic ESLint config as a fallback
 */
const createBasicESLintConfig = (useTypescript: boolean): string => {
  let config = `// ESLint configuration
export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/build/**']
  },
  // Config for JavaScript files
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_', 'caughtErrors': 'all', 'caughtErrorsIgnorePattern': '^_' }],
      'eqeqeq': ['error', 'always']
    }
  }`;

  // Add TypeScript configuration if needed
  if(useTypescript) {
    config += `,
  // Config for TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: {
        importSource: '@typescript-eslint/parser'
      },
      parserOptions: {
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': {
        importSource: '@typescript-eslint/eslint-plugin'
      }
    },
    rules: {
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_', 'caughtErrors': 'all', 'caughtErrorsIgnorePattern': '^_' }],
      'eqeqeq': ['error', 'always']
    }
  }`;
  }

  // Close the array
  config += `
];`;

  return config;
};

/**
 * Check if TypeScript is being used by looking for tsconfig.json
 */
const detectTypeScript = (cwd: string): boolean => existsSync(pathResolve(cwd, 'tsconfig.json'));

/**
 * Ensure package.json has type: module for ESM support
 */
const ensureModuleType = (cwd: string): void => {
  const packageJsonPath = pathResolve(cwd, 'package.json');

  if(existsSync(packageJsonPath)) {
    try {
      const packageJsonContent = readFileSync(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonContent);

      // If type is not set to module, set it
      if(packageJson.type !== 'module') {
        packageJson.type = 'module';
        writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
      }
    } catch(_error) {
      // Ignore errors
    }
  }
};

/**
 * No need to install dependencies as we'll use the ones from lex
 */
const installDependencies = async (_cwd: string, useTypescript: boolean, quiet: boolean): Promise<void> => {
  if(useTypescript) {
    log('Using TypeScript ESLint dependencies from lex...', 'info', quiet);
  }
};

// Function removed as it's no longer needed

/**
 * Run ESLint directly from lex's node_modules
 */
const runEslintWithLex = async (
  cwd: string,
  quiet: boolean,
  cliName: string,
  fix: boolean,
  debug: boolean,
  useTypescript: boolean,
  captureOutput?: (output: string) => void
): Promise<number> => {
  const spinner = createSpinner(quiet);

  try {
    // Determine which ESLint config to use
    // First check if the project has its own eslint.config.js
    const projectConfigPath = pathResolve(cwd, 'eslint.config.js');
    const hasProjectConfig = existsSync(projectConfigPath);

    // If not, try to find Lex's default config
    // Try different potential locations for the Lex config
    const possiblePaths = [
      // From src/commands/lint/lint.ts to root
      pathResolve(__dirname, '../../../../eslint.config.js'),
      // From packages/lex/src/commands/lint/lint.ts to packages/lex
      pathResolve(__dirname, '../../../eslint.config.js'),
      // From packages/lex/src/commands/lint/lint.ts to root
      pathResolve(__dirname, '../../../../../eslint.config.js'),
      // Absolute path if Lex is installed globally
      pathResolve(process.env.LEX_HOME || '/usr/local/lib/node_modules/@nlabs/lex', 'eslint.config.js')
    ];

    let lexConfigPath = '';
    for(const path of possiblePaths) {
      if(existsSync(path)) {
        lexConfigPath = path;
        break;
      }
    }

    // Determine which config file to use
    const configPath = hasProjectConfig ? projectConfigPath : (lexConfigPath || projectConfigPath);

    // Use npx to run eslint - this will use the one from lex if available
    // or download a temporary one if needed

    // Run eslint on JS files with config using npx with package specification
    const jsResult = await execa('npx', [
      '-p', 'eslint',
      'eslint',
      'src/**/*.{js,jsx}',
      '--config', configPath, // Use the determined config
      ...(fix ? ['--fix'] : []),
      ...(debug ? ['--debug'] : []),
      '--no-error-on-unmatched-pattern' // Don't error if no files are found
    ], {
      reject: false,
      stdio: 'pipe',
      cwd,
      shell: true // Needed for glob pattern expansion
    });

    // Display JS output and capture it if needed
    if(jsResult.stdout) {
      console.log(jsResult.stdout);
      if(captureOutput) {
        captureOutput(jsResult.stdout);
      }
    }

    if(jsResult.stderr) {
      console.error(jsResult.stderr);
      if(captureOutput) {
        captureOutput(jsResult.stderr);
      }
    }

    // Run eslint on TS files if needed
    let tsResult: any = {exitCode: 0, stdout: '', stderr: ''};
    if(useTypescript) {
      tsResult = await execa('npx', [
        '-p', 'eslint',
        '-p', '@typescript-eslint/parser',
        '-p', '@typescript-eslint/eslint-plugin',
        'eslint',
        'src/**/*.{ts,tsx}',
        '--config', configPath, // Use the determined config
        ...(fix ? ['--fix'] : []),
        ...(debug ? ['--debug'] : []),
        '--no-error-on-unmatched-pattern' // Don't error if no files are found
      ], {
        reject: false,
        stdio: 'pipe',
        cwd,
        shell: true // Needed for glob pattern expansion
      });

      // Display TS output
      if(tsResult.stdout) {
        console.log(tsResult.stdout);
      }

      if(tsResult.stderr) {
        console.error(tsResult.stderr);
      }
    }

    // Success if both exit codes are 0
    if(jsResult.exitCode === 0 && tsResult.exitCode === 0) {
      spinner.succeed('Linting completed!');
      return 0;
    }
    // Check for special cases - no files found
    const noFilesFound =
        (jsResult.stderr?.includes('No such file or directory') || jsResult.stdout?.includes('No such file or directory')) &&
        (!useTypescript || tsResult.stderr?.includes('No such file or directory') || tsResult.stdout?.includes('No such file or directory'));

    if(noFilesFound) {
      spinner.succeed('No files found to lint');
      return 0;
    }
    spinner.fail('Linting failed!');
    log(`\n${cliName} Error: ESLint found issues in your code.`, 'error', quiet);
    return 1;
  } catch(error) {
    spinner.fail('Linting failed!');
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);
    return 1;
  }
};

/**
 * Use AI to fix linting errors that couldn't be fixed automatically
 */
const applyAIFix = async (
  cwd: string,
  errors: string,
  quiet: boolean
): Promise<void> => {
  const spinner = createSpinner(quiet);
  spinner.start('Using AI to fix remaining lint issues...');

  try {
    // Extract file paths and errors from the ESLint output
    const fileErrorMap = new Map<string, string[]>();
    const lines = errors.split('\n');
    let currentFile = '';

    for(const line of lines) {
      if(line.startsWith('/')) {
        // This is a file path
        currentFile = line;
        fileErrorMap.set(currentFile, []);
      } else if(currentFile && line.trim() && !line.includes('✖') && !line.includes('potentially fixable')) {
        // This is an error line
        const errorArray = fileErrorMap.get(currentFile);
        if(errorArray) {
          errorArray.push(line.trim());
        }
      }
    }

    // Import the AI service dynamically to avoid circular dependencies
    const {callAIService} = await import('../../utils/aiService.js');

    // Process each file with errors
    for(const [filePath, fileErrors] of fileErrorMap.entries()) {
      if(fileErrors.length === 0) {
        continue;
      }

      // Read the file content
      const fileContent = readFileSync(filePath, 'utf8');

      // Prepare a prompt for AI
      const prompt = `Fix the following ESLint errors in this code:
${fileErrors.join('\n')}

Here's the code:
\`\`\`
${fileContent}
\`\`\`

Return only the fixed code without any explanations.`;

      // Call the AI service to get fixed code
      let fixedContent = await callAIService(prompt, quiet);

      // If AI service failed or returned empty result, fall back to rule-based fixes
      if(!fixedContent) {
        log('AI service unavailable or skipped, using rule-based fixes', 'info', quiet);
        fixedContent = fileContent;

        // Apply rule-based fixes for common issues
        if(fileErrors.some((e) => e.includes('is assigned a value but never used'))) {
          // Find variable names that are unused
          const unusedVarRegex = /'([^']+)' is assigned a value but never used/g;
          let match;
          while((match = unusedVarRegex.exec(fileErrors.join(' '))) !== null) {
            const varName = match[1];
            fixedContent = fixedContent.replace(
              new RegExp(`(const|let|var) ${varName}\\b`, 'g'),
              `$1 _${varName}`
            );
          }
        }

        if(fileErrors.some((e) => e.includes('Expected \'===\' and instead saw \'==\''))) {
          fixedContent = fixedContent.replace(/ == /g, ' === ');
        }

        if(fileErrors.some((e) => e.includes('Expected \'!==\' and instead saw \'!='))) {
          fixedContent = fixedContent.replace(/ != /g, ' !== ');
        }
      }

      // Write the fixed content back to the file
      writeFileSync(filePath, fixedContent, 'utf8');
    }

    spinner.succeed('AI fixes applied successfully!');
  } catch(error) {
    spinner.fail('Failed to apply AI fixes');
    log(`Error: ${error.message}`, 'error', quiet);
  }
};

export const lint = async (cmd: LintOptions, callback: LintCallback = process.exit): Promise<number> => {
  const {
    cliName = 'Lex',
    fix = false,
    debug = false,
    quiet = false,
    aifix = false,
    config = null
  } = cmd;

  log(`${cliName} linting...`, 'info', quiet);

  const cwd = process.cwd();
  const spinner = createSpinner(quiet);

  // Track if we need to restore an original config
  let originalConfig: string | null = null;
  let tempConfigPath: string | null = null;

  try {
    // Detect TypeScript directly
    const useTypescript = detectTypeScript(cwd);
    log(`TypeScript ${useTypescript ? 'detected' : 'not detected'} from tsconfig.json`, 'info', quiet);

    // Ensure package.json has type: module for ESM support
    ensureModuleType(cwd);

    // Install necessary dependencies
    await installDependencies(cwd, useTypescript, quiet);

    // Check for ESLint configuration files
    const projectConfigPath = pathResolve(cwd, 'eslint.config.js');
    const hasEslintConfig = existsSync(projectConfigPath) ||
                          existsSync(pathResolve(cwd, '.eslintrc.js')) ||
                          existsSync(pathResolve(cwd, '.eslintrc.json')) ||
                          existsSync(pathResolve(cwd, '.eslintrc.yml')) ||
                          existsSync(pathResolve(cwd, '.eslintrc.yaml')) ||
                          existsSync(pathResolve(cwd, '.eslintrc'));

    // Remove any existing .eslintrc.json file to avoid conflicts with eslint.config.js
    if(existsSync(pathResolve(cwd, '.eslintrc.json'))) {
      unlinkSync(pathResolve(cwd, '.eslintrc.json'));
    }

    // Try to find Lex's ESLint config if needed
    let lexConfigPath = '';
    let shouldCreateTempConfig = false;

    if(!hasEslintConfig) {
      // Try different potential locations for the Lex config
      const possiblePaths = [
        // From src/commands/lint/lint.ts to root
        pathResolve(__dirname, '../../../../eslint.config.js'),
        // From packages/lex/src/commands/lint/lint.ts to packages/lex
        pathResolve(__dirname, '../../../eslint.config.js'),
        // From packages/lex/src/commands/lint/lint.ts to root
        pathResolve(__dirname, '../../../../../eslint.config.js'),
        // Absolute path if Lex is installed globally
        pathResolve(process.env.LEX_HOME || '/usr/local/lib/node_modules/@nlabs/lex', 'eslint.config.js')
      ];

      // Find the first existing config
      for(const path of possiblePaths) {
        if(existsSync(path)) {
          lexConfigPath = path;
          break;
        }
      }

      if(debug) {
        log(`Current directory: ${__dirname}`, 'info', quiet);
        log(`Project config path: ${projectConfigPath}`, 'info', quiet);
        log(`Project config exists: ${hasEslintConfig}`, 'info', quiet);
        log(`Found Lex config: ${lexConfigPath}`, 'info', quiet);
        log(`Lex config exists: ${!!lexConfigPath && existsSync(lexConfigPath)}`, 'info', quiet);
      }

      // If we found Lex's config, use it
      if(lexConfigPath && existsSync(lexConfigPath)) {
        log('No ESLint configuration found in project. Using Lex\'s default configuration.', 'info', quiet);
      } else {
        // Otherwise, we need to create a temporary config
        shouldCreateTempConfig = true;
      }
    }

    // If user specified a config file, use that
    if(config) {
      const userConfigPath = pathResolve(cwd, config);
      if(existsSync(userConfigPath)) {
        log(`Using specified ESLint configuration: ${config}`, 'info', quiet);
        // User-specified config takes precedence
        shouldCreateTempConfig = false;
      } else {
        log(`Specified ESLint configuration not found: ${config}. Using Lex's default configuration.`, 'warn', quiet);
      }
    }

    // Create a temporary config if needed
    if(shouldCreateTempConfig) {
      log('No ESLint configuration found. Creating a temporary configuration...', 'info', quiet);
      const configResult = createDefaultESLintConfig(useTypescript, cwd);
      tempConfigPath = configResult.configPath;
      originalConfig = configResult.originalConfig;
    }

    // No need to add scripts to package.json anymore

    // Capture the ESLint output for AI fix if needed
    let eslintOutput = '';
    const captureOutput = (output: string) => {
      eslintOutput += `${output}\n`;
    };

    // Always run ESLint with --fix first to apply built-in fixes
    const shouldApplyAIFix = aifix || fix;
    const result = await runEslintWithLex(cwd, quiet, cliName, true, debug, useTypescript, captureOutput);

    // If there are still errors and aifix is enabled, try to fix them with AI
    if(result !== 0 && shouldApplyAIFix) {
      // Check if AI is configured
      let aiConfigured = false;
      try {
        // Dynamically import to avoid circular dependencies
        const {LexConfig} = await import('../../LexConfig.js');
        aiConfigured = !!(LexConfig.config.ai?.provider && LexConfig.config.ai.provider !== 'none');
      } catch(_) {
        // If we can't import LexConfig, assume AI is not configured
        aiConfigured = false;
      }

      // Apply AI fixes if AI is configured or aifix flag is explicitly set
      if(aiConfigured || aifix) {
        await applyAIFix(cwd, eslintOutput, quiet);

        // Run ESLint again to check if all issues are fixed
        const afterFixResult = await runEslintWithLex(cwd, quiet, cliName, false, debug, useTypescript, captureOutput);

        // Return the result of the second run
        callback(afterFixResult);
        return afterFixResult;
      }
    }

    callback(result);
    return result;
  } catch(error) {
    // Display error message
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);
    spinner.fail('Linting failed!');
    callback(1);
    return 1;
  } finally {
    // Restore the original config if we created a temporary one
    if(tempConfigPath && originalConfig) {
      try {
        writeFileSync(tempConfigPath, originalConfig, 'utf8');
      } catch(_error) {
        // Ignore errors
      }
    } else if(tempConfigPath) {
      // Remove the temporary config if there was no original
      try {
        unlinkSync(tempConfigPath);
      } catch(_error) {
        // Ignore errors
      }
    }
  }
};