/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import {existsSync, writeFileSync, readFileSync, unlinkSync} from 'fs';
import {resolve as pathResolve} from 'path';

import {createSpinner} from '../../utils/app.js';
import {log} from '../../utils/log.js';

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

  // Create a simple config that works for JavaScript files
  const eslintConfig = `// ESLint configuration
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
      'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }],
      'eqeqeq': ['error', 'always']
    }
  }
];`;

  // Write the config
  writeFileSync(configPath, eslintConfig, 'utf8');

  // Return both the config path and the original config
  return {
    configPath,
    originalConfig
  };
};

/**
 * Check if TypeScript is being used by looking for tsconfig.json
 */
const detectTypeScript = (cwd: string): boolean => {
  return existsSync(pathResolve(cwd, 'tsconfig.json'));
};

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

/**
 * Add or update the lint:direct script in package.json
 */
const addLintScript = (cwd: string, fix: boolean, debug: boolean, useTypescript: boolean): void => {
  const packageJsonPath = pathResolve(cwd, 'package.json');

  if(existsSync(packageJsonPath)) {
    try {
      const packageJsonContent = readFileSync(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonContent);

      // Ensure scripts object exists
      packageJson.scripts = packageJson.scripts || {};

      // Get path to lex's node_modules
      const lexPath = pathResolve(__dirname, '../../../');
      const eslintPath = pathResolve(lexPath, 'node_modules', '.bin', 'eslint');
      
      // Create direct eslint commands using lex's eslint
      const jsLintCommand = `${eslintPath} "src/**/*.{js,jsx}"${fix ? ' --fix' : ''}${debug ? ' --debug' : ''} || true`;
      const tsLintCommand = useTypescript ? `${eslintPath} "src/**/*.{ts,tsx}"${fix ? ' --fix' : ''}${debug ? ' --debug' : ''} || true` : '';
      
      // Add direct command to package.json
      packageJson.scripts['lint:direct'] = useTypescript 
        ? `${jsLintCommand} && ${tsLintCommand}`
        : jsLintCommand;

      // Write the updated package.json
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
    } catch(_error) {
      // Ignore errors
    }
  }
};

/**
 * Run ESLint directly from lex's node_modules
 */
const runEslintWithLex = async (
  cwd: string,
  quiet: boolean,
  cliName: string,
  fix: boolean,
  debug: boolean,
  useTypescript: boolean
): Promise<number> => {
  const spinner = createSpinner(quiet);

  try {
    // Use npx to run eslint - this will use the one from lex if available
    // or download a temporary one if needed
    
    // Run eslint on JS files with config using npx with package specification
    const jsResult = await execa('npx', [
      '-p', 'eslint',
      'eslint',
      'src/**/*.{js,jsx}',
      '--config', pathResolve(cwd, 'eslint.config.js'), // Use the config we created
      ...(fix ? ['--fix'] : []),
      ...(debug ? ['--debug'] : []),
      '--no-error-on-unmatched-pattern' // Don't error if no files are found
    ], {
      reject: false,
      stdio: 'pipe',
      cwd,
      shell: true // Needed for glob pattern expansion
    });
    
    // Display JS output
    if(jsResult.stdout) {
      console.log(jsResult.stdout);
    }

    if(jsResult.stderr) {
      console.error(jsResult.stderr);
    }
    
    // Run eslint on TS files if needed
    let tsResult: any = { exitCode: 0, stdout: '', stderr: '' };
    if(useTypescript) {
      tsResult = await execa('npx', [
        '-p', 'eslint',
        '-p', '@typescript-eslint/parser',
        '-p', '@typescript-eslint/eslint-plugin',
        'eslint',
        'src/**/*.{ts,tsx}',
        '--config', pathResolve(cwd, 'eslint.config.js'), // Use the config we created
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
    } else {
      // Check for special cases - no files found
      const noFilesFound = 
        (jsResult.stderr?.includes('No such file or directory') || jsResult.stdout?.includes('No such file or directory')) &&
        (!useTypescript || tsResult.stderr?.includes('No such file or directory') || tsResult.stdout?.includes('No such file or directory'));
      
      if(noFilesFound) {
        spinner.succeed('No files found to lint');
        return 0;
      } else {
        spinner.fail('Linting failed!');
        log(`\n${cliName} Error: ESLint found issues in your code.`, 'error', quiet);
        return 1;
      }
    }
  } catch(error) {
    spinner.fail('Linting failed!');
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);
    return 1;
  }
};

export const lint = async (cmd: LintOptions, callback: LintCallback = process.exit): Promise<number> => {
  const {
    cliName = 'Lex',
    fix = false,
    debug = false,
    quiet = false
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
    const hasEslintConfig = existsSync(pathResolve(cwd, 'eslint.config.js')) ||
                          existsSync(pathResolve(cwd, '.eslintrc.js')) ||
                          existsSync(pathResolve(cwd, '.eslintrc.json')) ||
                          existsSync(pathResolve(cwd, '.eslintrc.yml')) ||
                          existsSync(pathResolve(cwd, '.eslintrc.yaml')) ||
                          existsSync(pathResolve(cwd, '.eslintrc'));
                          
    // Remove any existing .eslintrc.json file to avoid conflicts with eslint.config.js
    if (existsSync(pathResolve(cwd, '.eslintrc.json'))) {
      unlinkSync(pathResolve(cwd, '.eslintrc.json'));
    }

    // Create a default config if none exists
    if(!hasEslintConfig) {
      log('No ESLint configuration found. Creating a default configuration...', 'info', quiet);
      const configResult = createDefaultESLintConfig(useTypescript, cwd);
      tempConfigPath = configResult.configPath;
      originalConfig = configResult.originalConfig;
    }

    // No need to add scripts to package.json anymore
    
    // Run ESLint directly using lex's dependencies
    const result = await runEslintWithLex(cwd, quiet, cliName, fix, debug, useTypescript);

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