/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import { execa } from 'execa';
import { existsSync } from 'fs';
import { sync as globSync } from 'glob';
import { resolve as pathResolve } from 'path';

import { LexConfig } from '../../LexConfig.js';
import { createSpinner } from '../../utils/app.js';
import { resolveBinaryPath } from '../../utils/file.js';
import { log } from '../../utils/log.js';

export interface StorybookOptions {
  readonly cliName?: string;
  readonly config?: string;
  readonly open?: boolean;
  readonly port?: number;
  readonly quiet?: boolean;
  readonly static?: boolean;
  readonly variables?: string;
}

export type StorybookCallback = (status: number) => void;

/**
 * Find all story files in the project
 */
const findStoryFiles = (): string[] => {
  const storyPatterns = [
    '**/*.stories.{ts,tsx,js,jsx}',
    '**/*.story.{ts,tsx,js,jsx}',
    '**/stories/**/*.{ts,tsx,js,jsx}'
  ];

  const storyFiles: string[] = [];

  storyPatterns.forEach(pattern => {
    const files = globSync(pattern, {
      cwd: process.cwd(),
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });
    storyFiles.push(...files);
  });

  return storyFiles;
};

/**
 * Check if Storybook is properly initialized in the project or Lex
 */
const checkStorybookInitialization = (): boolean => {
  const projectConfigDir = pathResolve(process.cwd(), '.storybook');
  const lexConfigDir = pathResolve(LexConfig.getLexDir(), '.storybook');
  return existsSync(projectConfigDir) || existsSync(lexConfigDir);
};

export const storybook = async (cmd: StorybookOptions, callback: StorybookCallback = () => ({})): Promise<number> => {
  const { cliName = 'Lex', config, open = false, port, quiet, static: staticBuild = false, variables } = cmd;

  // Spinner
  const spinner = createSpinner(quiet);

  // Display status
  log(`${cliName} starting Storybook...`, 'info', quiet);

  // Get custom configuration
  await LexConfig.parseConfig(cmd);

  // Set node environment variables
  let variablesObj: object = { NODE_ENV: 'development' };

  if (variables) {
    try {
      variablesObj = JSON.parse(variables);
    } catch (_error) {
      log(`\n${cliName} Error: Environment variables option is not a valid JSON object.`, 'error', quiet);
      callback(1);
      return 1;
    }
  }

  process.env = { ...process.env, ...variablesObj };

  // Find story files
  spinner.start('Finding story files...');
  const storyFiles = findStoryFiles();

  if (storyFiles.length === 0) {
    spinner.fail('No story files found in the project.');
    log('Please create story files with .stories.ts/.stories.js extensions or in a stories/ directory.', 'info', quiet);
    callback(1);
    return 1;
  }

  spinner.succeed(`Found ${storyFiles.length} story file(s)`);

  // Check if Storybook is initialized (in project or Lex)
  if (!checkStorybookInitialization()) {
    spinner.fail('Storybook is not initialized in this project or in Lex.');
    log('Please run "npx storybook@latest init" to set up Storybook in your project, or ensure Lex has a valid .storybook configuration.', 'info', quiet);
    callback(1);
    return 1;
  }

  // Determine Storybook config directory
  const projectConfigDir = pathResolve(process.cwd(), '.storybook');
  const lexConfigDir = pathResolve(LexConfig.getLexDir(), '.storybook');
  // Use project config if it exists, otherwise use Lex's canonical config
  const configDir = config || (existsSync(projectConfigDir) ? projectConfigDir : lexConfigDir);

  // Determine Storybook binary to use
  const storybookPath = resolveBinaryPath('storybook');

  if (!storybookPath) {
    log(`\n${cliName} Error: storybook binary not found in Lex's node_modules or monorepo root`, 'error', quiet);
    log('Please reinstall Lex or check your Storybook installation.', 'info', quiet);
    callback(1);
    return 1;
  }

  // Build Storybook arguments - Storybook v9 uses subcommands
  const storybookArgs = [staticBuild ? 'build' : 'dev'];
  // Always use the determined config directory
  storybookArgs.push('--config-dir', configDir);

  if (port) {
    storybookArgs.push('--port', port.toString());
  }

  if (open) {
    storybookArgs.push('--open');
  }

  if (staticBuild) {
    // For static build, we need to specify the output directory
    const outputDir = pathResolve(process.cwd(), 'storybook-static');
    storybookArgs.push('--output-dir', outputDir);
  }

  try {
    spinner.start(staticBuild ? 'Building static Storybook...' : 'Starting Storybook development server...');

    // @ts-ignore
    const storybookProcess = execa(storybookPath, storybookArgs, {
      encoding: 'utf8',
      env: {
        ...process.env,
        LEX_QUIET: quiet,
        STORYBOOK_OPEN: open
      },
      stdio: 'pipe' // Change from 'inherit' to 'pipe' so we can process output
    });

    // Stop spinner after a short delay to let Storybook start
    setTimeout(() => {
      spinner.succeed('Storybook development server starting...');
    }, 2000);

    // Pipe the output to show it in real-time
    storybookProcess.stdout?.pipe(process.stdout);
    storybookProcess.stderr?.pipe(process.stderr);

    await storybookProcess;

    callback(0);
    return 0;
  } catch (error) {
    // Display error message
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);
    spinner.fail(`There was an error while running storybook.`);
    callback(1);
    return 1;
  }
};