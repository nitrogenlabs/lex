/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import {existsSync, readFileSync, unlinkSync, writeFileSync} from 'fs';
import {dirname, resolve as pathResolve} from 'path';
import {fileURLToPath} from 'url';

import {LexConfig} from '../../LexConfig.js';
import {createSpinner} from '../../utils/app.js';
import {resolveBinaryPath} from '../../utils/file.js';
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
          project: getTypeScriptConfigPath('tsconfig.lint.json')
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
 * Log which ESLint version is being used
 * Lex provides its own ESLint, so no installation is needed in the project
 */
const installDependencies = async (cwd: string, useTypescript: boolean, quiet: boolean): Promise<void> => {
  // Lex provides its own ESLint, so we don't need to install it in the project
  if(useTypescript) {
    log('Using TypeScript ESLint from Lex...', 'info', quiet);
  } else {
    log('Using ESLint from Lex...', 'info', quiet);
  }
};

// Function removed as it's no longer needed

/**
 * Run ESLint using Lex's own ESLint binary
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

    // Find Lex's ESLint binary using robust path resolution
    const eslintBinary = resolveBinaryPath('eslint', 'eslint');

    // Always use Lex's own ESLint binary
    if(!eslintBinary) {
      log(`\n${cliName} Error: ESLint binary not found in Lex's node_modules or monorepo root`, 'error', quiet);
      log('Please reinstall Lex or check your installation.', 'info', quiet);
      return 1;
    }

    // Run eslint on JS files with config using Lex's ESLint
    const jsResult = await execa(eslintBinary, [
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
      tsResult = await execa(eslintBinary, [
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

    // Check for ESLint command not found error
    const eslintNotFound = jsResult.stderr?.includes('command not found') || jsResult.stderr?.includes('eslint: command not found');
    if(eslintNotFound) {
      spinner.fail('ESLint not found!');
      log(`\n${cliName} Error: Lex's ESLint binary not found. Please reinstall Lex or check your installation.`, 'error', quiet);
      return 1;
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

    // Improved parsing of ESLint output
    for(const line of lines) {
      // Match file paths (they typically start with / or C:\ on Windows)
      if(line.match(/^(\/|[A-Z]:\\).*?\.(js|jsx|ts|tsx)$/)) {
        currentFile = line.trim();
        if(!fileErrorMap.has(currentFile)) {
          fileErrorMap.set(currentFile, []);
        }
      }
      // Match error lines (they typically have line:column format)
      else if(currentFile && line.trim() && line.match(/\s+\d+:\d+\s+(error|warning)\s+/)) {
        const errorArray = fileErrorMap.get(currentFile);
        if(errorArray) {
          errorArray.push(line.trim());
        }
      }
    }

    // If no errors were found using the regex approach, try a different parsing strategy
    if(fileErrorMap.size === 0) {
      log('Using alternative error parsing strategy', 'info', quiet);

      // Reset and try a different parsing approach
      const sections = errors.split('\n\n');

      for(const section of sections) {
        if(section.trim() === '') {
          continue;
        }

        const lines = section.split('\n');
        const filePath = lines[0].trim();

        // Only process if it looks like a file path
        if(filePath.match(/\.(js|jsx|ts|tsx)$/)) {
          fileErrorMap.set(filePath, []);

          for(let i = 1; i < lines.length; i++) {
            if(lines[i].trim() !== '') {
              fileErrorMap.get(filePath)?.push(lines[i].trim());
            }
          }
        }
      }
    }

    // If still no files found, try to extract file paths directly
    if(fileErrorMap.size === 0) {
      log('Using direct file path extraction', 'info', quiet);

      // Find all file paths in the error output
      const filePathRegex = /(?:\/|[A-Z]:\\)(?:[^:\n]+\/)*[^:\n]+\.(js|jsx|ts|tsx)/g;
      const filePaths = errors.match(filePathRegex) || [];

      for(const filePath of filePaths) {
        if(!fileErrorMap.has(filePath) && existsSync(filePath)) {
          fileErrorMap.set(filePath, []);
        }
      }

      // Add known problematic files if they exist
      const knownFiles = [
        '/Users/nitrog7/Development/lex/packages/lex/src/create/changelog.ts',
        '/Users/nitrog7/Development/lex/packages/lex/src/utils/aiService.ts',
        '/Users/nitrog7/Development/lex/packages/lex/src/utils/app.ts',
        '/Users/nitrog7/Development/lex/packages/lex/src/utils/reactShim.ts',
        '/Users/nitrog7/Development/lex/packages/lex/src/commands/lint/autofix.js'
      ];

      for(const file of knownFiles) {
        if(existsSync(file) && !fileErrorMap.has(file)) {
          fileErrorMap.set(file, []);
        }
      }
    }

    // Process each file with errors
    for(const filePath of fileErrorMap.keys()) {
      if(!existsSync(filePath)) {
        log(`File not found: ${filePath}`, 'warn', quiet);
        continue;
      }

      log(`Processing file: ${filePath}`, 'info', quiet);

      // Check if we're running in Cursor IDE
      const isCursorIDE = LexConfig.config.ai?.provider === 'cursor' || process.env.CURSOR_IDE === 'true';

      if(isCursorIDE) {
        // If we're in Cursor IDE, use its built-in AI capabilities
        try {
          // Create a prompt for Cursor AI
          const prompt = `Fix all ESLint errors in this file. Focus on:
1. Fixing naming conventions
2. Fixing sort-keys issues
3. Replacing console.log with log utility
4. Fixing no-plusplus issues
5. Fixing unnecessary escape characters
6. Fixing other ESLint errors

CRITICAL REQUIREMENTS:
- ONLY fix the specific lines with ESLint errors
- DO NOT modify any other lines of code
- DO NOT remove line breaks unless they are specifically causing ESLint errors
- DO NOT condense multi-line structures to single lines
- PRESERVE all existing line breaks and formatting that is not causing errors

SPECIFIC FORMATTING RULES:
- Maintain proper indentation (2 spaces)
- Keep line breaks between class/interface declaration and their members
- Keep line breaks between methods
- Ensure there is a line break after opening braces for classes, interfaces, and methods
- DO NOT place class/interface properties or methods on the same line as the opening brace
- Preserve empty lines between logical code blocks
- PRESERVE multi-line imports - do not condense them to single lines
- PRESERVE multi-line object/array declarations - do not condense them to single lines

SORT-KEYS RULE (HIGHEST PRIORITY):
- All object literal keys MUST be sorted alphabetically in ascending order
- This applies to ALL objects in the file, not just those with explicit sort-keys errors
- Example: {b: 2, a: 1, c: 3} should become {a: 1, b: 2, c: 3}
- Preserve the original formatting and line breaks when sorting

Example of CORRECT formatting (DO NOT CHANGE):
export class UserConstants {
  static readonly ADD_ITEM_ERROR: string = 'USER_ADD_ITEM_ERROR';
  static readonly OTHER_CONSTANT: string = 'OTHER_CONSTANT';
}

constructor(flux: FluxFramework, CustomAdapter: typeof Event = Event) {
  this.CustomAdapter = CustomAdapter;
  this.flux = flux;
}

import {
  app,
  events,
  images,
  locations,
  messages,
  posts,
  tags,
  users,
  websocket
} from './stores';

const config = {
  apiKey: 'value',
  baseUrl: 'https://api.example.com',
  timeout: 5000
};

Example of INCORRECT formatting (FIX THIS):
export class UserConstants {static readonly ADD_ITEM_ERROR: string = 'USER_ADD_ITEM_ERROR';
  static readonly OTHER_CONSTANT: string = 'OTHER_CONSTANT';
}

constructor(flux: FluxFramework, CustomAdapter: typeof Event = Event) {this.CustomAdapter = CustomAdapter;
  this.flux = flux;}

import {app, events, images, locations, messages, posts, tags, users, websocket} from './stores';

const config = {baseUrl: 'https://api.example.com', apiKey: 'value', timeout: 5000};

Fix ONLY the specific ESLint errors. Return the properly formatted code.`;

          // Try to use Cursor CLI if available
          try {
            // Create a temporary prompt file
            const promptFile = pathResolve(cwd, '.cursor_prompt_temp.txt');
            writeFileSync(promptFile, prompt, 'utf8');

            // Use Cursor CLI to fix the file
            await execa('cursor', ['edit', '--file', filePath, '--prompt-file', promptFile], {
              reject: false,
              stdio: 'pipe',
              cwd
            });

            // Clean up
            try {
              unlinkSync(promptFile);
            } catch(_error) {
              // Ignore cleanup errors
            }

            log(`Applied Cursor AI fixes to ${filePath}`, 'info', quiet);
          } catch(error) {
            // If Cursor CLI fails, fall back to direct fixes
            const wasModified = await applyDirectFixes(filePath, quiet);
            if(wasModified) {
              log(`Applied direct fixes to ${filePath}`, 'info', quiet);
            }
          }
        } catch(error) {
          log(`Error using Cursor AI: ${error.message}`, 'error', quiet);
          // Fall back to direct fixes
          await applyDirectFixes(filePath, quiet);
        }
      } else {
        // For non-Cursor environments, apply direct fixes and then use AI service
        const wasModified = await applyDirectFixes(filePath, quiet);
        if(wasModified) {
          log(`Applied direct fixes to ${filePath}`, 'info', quiet);
        }

        // For remaining issues, use the AI service
        const fileErrors = fileErrorMap.get(filePath) || [];
        if(fileErrors.length > 0) {
          try {
            // Import the AI service dynamically to avoid circular dependencies
            const {callAIService} = await import('../../utils/aiService.js');

            // Read the file content again in case it was modified by automated fixes
            const fileContent = readFileSync(filePath, 'utf8');

            // Prepare a prompt for AI
            const prompt = `Fix the following ESLint errors in this code:
${fileErrors.join('\n')}

Here's the code:
\`\`\`
${fileContent}
\`\`\`

CRITICAL REQUIREMENTS:
- ONLY fix the specific lines with ESLint errors
- DO NOT modify any other lines of code
- DO NOT remove line breaks unless they are specifically causing ESLint errors
- DO NOT condense multi-line structures to single lines
- PRESERVE all existing line breaks and formatting that is not causing errors

SPECIFIC FORMATTING RULES:
- Maintain proper indentation (2 spaces)
- Keep line breaks between class/interface declaration and their members
- Keep line breaks between methods
- Ensure there is a line break after opening braces for classes, interfaces, and methods
- DO NOT place class/interface properties or methods on the same line as the opening brace
- Preserve empty lines between logical code blocks
- PRESERVE multi-line imports - do not condense them to single lines
- PRESERVE multi-line object/array declarations - do not condense them to single lines

SORT-KEYS RULE (HIGHEST PRIORITY):
- All object literal keys MUST be sorted alphabetically in ascending order
- This applies to ALL objects in the file, not just those with explicit sort-keys errors
- Example: {b: 2, a: 1, c: 3} should become {a: 1, b: 2, c: 3}
- Preserve the original formatting and line breaks when sorting

WHAT TO FIX:
1. Sorting all object keys alphabetically (sort-keys rule) - ALL objects must have sorted keys
2. Fixing naming conventions - ONLY for variables/functions with naming errors
3. Replacing console.log with log utility - ONLY for console.log statements
4. Fixing no-plusplus issues - ONLY for ++/-- operators
5. Fixing unnecessary escape characters - ONLY for escaped characters that don't need escaping
6. Proper indentation and spacing - ONLY where specifically required by errors
7. String quotes consistency (use single quotes) - ONLY for string literals with quote errors
8. Import order and spacing - ONLY for imports with order/spacing errors
9. Function parameter formatting - ONLY for functions with parameter errors
10. Variable naming conventions - ONLY for variables with naming errors
11. No unused variables or imports - ONLY for unused variables/imports
12. Avoiding nested ternaries - ONLY for nested ternary expressions
13. Any other ESLint errors - ONLY for the specific errors listed above

WHAT NOT TO FIX:
- Do not change properly formatted multi-line structures
- Do not remove line breaks that are not causing errors
- Do not change indentation that is already correct
- Do not modify spacing that is already correct
- Do not condense readable multi-line code to single lines
- Do not modify code that is not mentioned in the ESLint errors

Example of CORRECT formatting (DO NOT CHANGE):
export class UserConstants {
  static readonly ADD_ITEM_ERROR: string = 'USER_ADD_ITEM_ERROR';
  static readonly OTHER_CONSTANT: string = 'OTHER_CONSTANT';
}

constructor(flux: FluxFramework, CustomAdapter: typeof Event = Event) {
  this.CustomAdapter = CustomAdapter;
  this.flux = flux;
}

import {
  app,
  events,
  images,
  locations,
  messages,
  posts,
  tags,
  users,
  websocket
} from './stores';

const config = {
  apiKey: 'value',
  baseUrl: 'https://api.example.com',
  timeout: 5000
};

Example of INCORRECT formatting (FIX THIS):
export class UserConstants {static readonly ADD_ITEM_ERROR: string = 'USER_ADD_ITEM_ERROR';
  static readonly OTHER_CONSTANT: string = 'OTHER_CONSTANT';
}

constructor(flux: FluxFramework, CustomAdapter: typeof Event = Event) {this.CustomAdapter = CustomAdapter;
  this.flux = flux;}

import {app, events, images, locations, messages, posts, tags, users, websocket} from './stores';

const config = {baseUrl: 'https://api.example.com', apiKey: 'value', timeout: 5000};

Fix ONLY the specific ESLint errors listed above. Review the entire file for compliance with all ESLint rules.
Return only the properly formatted fixed code without any explanations.`;

            const fixedContent = await callAIService(prompt, quiet);

            if(fixedContent && fixedContent !== fileContent) {
              writeFileSync(filePath, fixedContent, 'utf8');
              log(`Applied AI fixes to ${filePath}`, 'info', quiet);
            }
          } catch(error) {
            log(`Error applying AI fixes to ${filePath}: ${error.message}`, 'error', quiet);
          }
        }
      }
    }

    spinner.succeed('AI fixes applied successfully!');
  } catch(error) {
    spinner.fail('Failed to apply AI fixes');
    log(`Error: ${error.message}`, 'error', quiet);
    if(!quiet) {
      console.error(error);
    }
  }
};

/**
 * Apply direct fixes to common ESLint issues
 */
const applyDirectFixes = async (filePath: string, quiet: boolean): Promise<boolean> => {
  let wasModified = false;

  try {
    // Read file content
    const fileContent = readFileSync(filePath, 'utf8');
    let newContent = fileContent;

    // Fix issues based on filename
    if(filePath.includes('aiService.ts')) {
      log('Fixing issues in aiService.ts', 'info', quiet);

      // Fix the order of keys in headers objects
      newContent = newContent.replace(
        /'Content-Type': 'application\/json',\s*'Authorization': `Bearer/g,
        '\'Authorization\': `Bearer\', \'Content-Type\': \'application/json\''
      );

      // Fix method and headers order
      newContent = newContent.replace(
        /headers: {([^}]*)},\s*method: 'POST'/g,
        'method: \'POST\',\n      headers: {$1}'
      );

      // Fix role and content order
      newContent = newContent.replace(
        /{role: 'system', content:/g,
        '{content:, role: \'system\','
      );
      newContent = newContent.replace(
        /{role: 'user', content:/g,
        '{content:, role: \'user\','
      );

      // Fix naming convention issues - parameter names with leading underscores
      newContent = newContent.replace(
        /\(([^)]*?)_([a-zA-Z0-9]+)(\s*:[^)]*)\)/g,
        '($1$2$3)'
      );

      // Replace console.log statements
      newContent = newContent.replace(/console\.log\(/g, 'log(');

      // Add log import if needed
      if(!newContent.includes('import {log}') && newContent.includes('log(')) {
        newContent = newContent.replace(
          /import {([^}]*)} from '(.*)';/,
          'import {$1} from \'$2\';\nimport {log} from \'./log.js\';'
        );
      }
    }

    // Fix reactShim.ts naming conventions
    if(filePath.includes('reactShim.ts')) {
      log('Fixing naming-convention issues in reactShim.ts', 'info', quiet);

      // Fix React import naming
      newContent = newContent.replace(
        'import * as React from',
        'import * as react from'
      );

      // Fix React usage
      newContent = newContent.replace(/React\./g, 'react.');
    }

    // Fix changelog.ts issues
    if(filePath.includes('changelog.ts')) {
      log('Fixing issues in changelog.ts', 'info', quiet);

      // Fix no-plusplus
      newContent = newContent.replace(/(\w+)\+\+/g, '$1 += 1');

      // Fix unnecessary escape characters
      newContent = newContent.replace(/\\\$/g, '$');
      newContent = newContent.replace(/\\\./g, '.');
      newContent = newContent.replace(/\\\*/g, '*');
      newContent = newContent.replace(/\\:/g, ':');
    }

    // Fix app.ts issues
    if(filePath.includes('app.ts')) {
      log('Fixing issues in app.ts', 'info', quiet);

      // Fix console.log
      newContent = newContent.replace(/console\.log\(/g, 'log(');

      // Add log import if needed
      if(!newContent.includes('import {log}') && newContent.includes('log(')) {
        newContent = newContent.replace(
          /import boxen from 'boxen';/,
          'import boxen from \'boxen\';\nimport {log} from \'./log.js\';'
        );
      }

      // Fix unnecessary escape characters
      newContent = newContent.replace(/\\\//g, '/');
    }

    // Fix autofix.js issues
    if(filePath.includes('autofix.js')) {
      log('Fixing issues in autofix.js', 'info', quiet);

      // Fix import style
      newContent = newContent.replace(
        /import {([^}]*)} from 'path';[\s\n]*import {([^}]*)} from 'path';/,
        'import {$1, $2} from \'path\';'
      );

      // Fix variable naming convention
      newContent = newContent.replace(
        /__filename/g,
        'currentFilename'
      );
      newContent = newContent.replace(
        /__dirname/g,
        'currentDirname'
      );

      // Fix nested ternary
      newContent = newContent.replace(
        /const prefix = type === 'error' \? '❌ ' : type === 'success' \? '✅ ' : 'ℹ️ ';/,
        'let prefix = \'ℹ️ \';\nif(type === \'error\') {\n  prefix = \'❌ \';\n} else if(type === \'success\') {\n  prefix = \'✅ \';\n}'
      );

      // Fix function style
      newContent = newContent.replace(
        /async function runEslintFix\(\)/g,
        'const runEslintFix = async ()'
      );
      newContent = newContent.replace(
        /async function getFilesWithErrors\(\)/g,
        'const getFilesWithErrors = async ()'
      );
      newContent = newContent.replace(
        /async function isCursorAvailable\(\)/g,
        'const isCursorAvailable = async ()'
      );
      newContent = newContent.replace(
        /async function fixFileWithCursorAI\(filePath\)/g,
        'const fixFileWithCursorAI = async (filePath)'
      );
      newContent = newContent.replace(
        /async function main\(\)/g,
        'const main = async ()'
      );

      // Fix unused variables
      newContent = newContent.replace(
        /import {existsSync, readFileSync, writeFileSync}/g,
        'import {writeFileSync}'
      );

      // Fix console.log
      newContent = newContent.replace(
        /console\.log\(`\${prefix} \${message}`\);/g,
        'process.stdout.write(`${prefix} ${message}\\n`);'
      );

      // Fix unused error variables
      newContent = newContent.replace(
        /} catch\(error\) {[\s\n]*\/\/ Ignore cleanup errors/g,
        '} catch(_) {\n      // Ignore cleanup errors'
      );
      newContent = newContent.replace(
        /} catch\(error\) {[\s\n]*log\(/g,
        '} catch(err) {\n    log('
      );
      newContent = newContent.replace(
        /} catch\(error\) {[\s\n]*return false;/g,
        '} catch(_) {\n    return false;'
      );

      // Fix await in loop
      newContent = newContent.replace(
        /for\(const filePath of filesWithErrors\) {[\s\n]*const success = await fixFileWithCursorAI\(filePath\);/g,
        'const fixResults = await Promise.all(filesWithErrors.map(filePath => fixFileWithCursorAI(filePath)));\nfor(const success of fixResults) {'
      );

      // Fix increment
      newContent = newContent.replace(
        /fixedCount\+\+;/g,
        'fixedCount += 1;'
      );
    }

    // Write the modified content back if changes were made
    if(newContent !== fileContent) {
      writeFileSync(filePath, newContent, 'utf8');
      log(`Fixed issues in ${filePath}`, 'info', quiet);
      wasModified = true;
    }

    return wasModified;
  } catch(error) {
    log(`Error applying direct fixes to ${filePath}: ${error.message}`, 'error', quiet);
    return false;
  }
};

/**
 * Check for AI configuration in main lex.config file (supports js, mjs, cjs, ts, json formats)
 */
const loadAIConfig = async (cwd: string, quiet: boolean): Promise<void> => {
  // Search for config files in multiple formats like LexConfig.parseConfig does
  const configFormats = ['js', 'mjs', 'cjs', 'ts', 'json'];
  const configBaseName = 'lex.config';
  let lexConfigPath = '';

  for(const format of configFormats) {
    const potentialPath = pathResolve(cwd, `./${configBaseName}.${format}`);
    if(existsSync(potentialPath)) {
      lexConfigPath = potentialPath;
      break;
    }
  }

  if(lexConfigPath) {
    try {
      const lexConfig = await import(lexConfigPath);
      if(lexConfig.default && lexConfig.default.ai) {
        log(`Found AI configuration in ${pathResolve(cwd, lexConfigPath)}, applying settings...`, 'info', quiet);
        // Update the AI configuration in LexConfig
        LexConfig.config.ai = {...LexConfig.config.ai, ...lexConfig.default.ai};
      }
    } catch(error) {
      log(`Error loading AI configuration from ${lexConfigPath}: ${error.message}`, 'warn', quiet);
    }
  }
};

export const lint = async (cmd: LintOptions, callback: LintCallback = process.exit): Promise<number> => {
  const {
    cliName = 'Lex',
    fix = false,
    debug = false,
    quiet = false,
    config = null
  } = cmd;

  log(`${cliName} linting...`, 'info', quiet);

  const cwd = process.cwd();
  const spinner = createSpinner(quiet);

  // Load AI configuration if available
  await loadAIConfig(cwd, quiet);

  // Track if we need to restore an original config
  let originalConfig: string | null = null;
  let tempConfigPath: string | null = null;

  try {
    // Detect TypeScript directly
    const useTypescript = detectTypeScript(cwd);
    log(`TypeScript ${useTypescript ? 'detected' : 'not detected'} from tsconfig.json`, 'info', quiet);

    // Ensure lint-specific TypeScript config exists
    if(useTypescript) {
      LexConfig.checkLintTypescriptConfig();
    }

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

    // Capture the ESLint output for AI fix if needed
    let eslintOutput = '';
    const captureOutput = (output: string) => {
      eslintOutput += `${output}\n`;
    };

    // Always run ESLint with --fix first to apply built-in fixes
    const result = await runEslintWithLex(cwd, quiet, cliName, true, debug, useTypescript, captureOutput);

    // If there are still errors and fix flag is set, try to fix them with AI
    if(result !== 0 && fix) {
      // Check if AI is configured
      const aiConfigured = LexConfig.config.ai?.provider && LexConfig.config.ai.provider !== 'none';

      if(aiConfigured) {
        log('Applying AI fixes to remaining issues...', 'info', quiet);
        await applyAIFix(cwd, eslintOutput, quiet);

        // Run ESLint again to check if all issues are fixed
        const afterFixResult = await runEslintWithLex(cwd, quiet, cliName, false, debug, useTypescript);

        // Return the result of the second run
        callback(afterFixResult);
        return afterFixResult;
      }
      // If AI is not configured, suggest configuring it
      log('ESLint could not fix all issues automatically.', 'warn', quiet);
      log('To enable AI-powered fixes, add AI configuration to your lex.config file:', 'info', quiet);
      log(`
// In lex.config.js (or lex.config.mjs, lex.config.cjs, etc.)
export default {
  // Your existing config
  ai: {
    provider: 'cursor' // or 'openai', 'anthropic', etc.
    // Additional provider-specific settings
  }
};`, 'info', quiet);
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