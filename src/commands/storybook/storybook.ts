/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import {existsSync} from 'fs';
import {sync as globSync} from 'glob';
import {resolve as pathResolve} from 'path';

import {LexConfig} from '../../LexConfig.js';
import {createSpinner} from '../../utils/app.js';
import {resolveBinaryPath} from '../../utils/file.js';
import {log} from '../../utils/log.js';

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

  storyPatterns.forEach((pattern) => {
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
  const {cliName = 'Lex', config, open = false, port, quiet, static: staticBuild = false, variables} = cmd;

  // Spinner
  const spinner = createSpinner(quiet);

  // Display status
  log(`${cliName} starting Storybook...`, 'info', quiet);

  // Get custom configuration
  await LexConfig.parseConfig(cmd);

  // Set node environment variables
  let variablesObj: object = {NODE_ENV: 'development'};

  if(variables) {
    try {
      variablesObj = JSON.parse(variables);
    } catch(_error) {
      log(`\n${cliName} Error: Environment variables option is not a valid JSON object.`, 'error', quiet);
      callback(1);
      return 1;
    }
  }

  process.env = {...process.env, ...variablesObj};

  // Find story files
  spinner.start('Finding story files...');
  const storyFiles = findStoryFiles();

  if(storyFiles.length === 0) {
    spinner.fail('No story files found in the project.');
    log('Please create story files with .stories.ts/.stories.js extensions or in a stories/ directory.', 'info', quiet);
    callback(1);
    return 1;
  }

  spinner.succeed(`Found ${storyFiles.length} story file(s)`);

  // Check if Storybook is initialized (in project or Lex)
  if(!checkStorybookInitialization()) {
    spinner.fail('Storybook is not initialized in this project or in Lex.');
    log('Please run "npx storybook@latest init" to set up Storybook in your project, or ensure Lex has a valid .storybook configuration.', 'info', quiet);
    callback(1);
    return 1;
  }

  // Determine Storybook config directory
  const projectConfigDir = pathResolve(process.cwd(), '.storybook');
  const lexConfigDir = pathResolve(LexConfig.getLexDir(), '.storybook');

  // Use project config if it exists, otherwise use Lex's canonical config
  let configDir = config || (existsSync(projectConfigDir) ? projectConfigDir : lexConfigDir);

  // Debug output
  if(!quiet) {
    log(`Project config dir: ${projectConfigDir} (exists: ${existsSync(projectConfigDir)})`, 'info', quiet);
    log(`Lex config dir: ${lexConfigDir} (exists: ${existsSync(lexConfigDir)})`, 'info', quiet);
    log(`Initial config dir: ${configDir}`, 'info', quiet);
  }

  // If using Lex's config, we need to create a temporary config that points to the current project's stories
  if(configDir === lexConfigDir) {
    if(!quiet) {
      log('Using Lex config, will create temporary config in project .storybook directory', 'info', quiet);
    }
    const projectStorybookDir = pathResolve(process.cwd(), '.storybook');

    // Create or update the project's .storybook directory
    const fs = await import('fs/promises');
    await fs.mkdir(projectStorybookDir, {recursive: true});

    // Copy Lex's main.ts and modify it to look for stories in the current project
    const lexMainPath = pathResolve(lexConfigDir, 'main.ts');
    const projectMainPath = pathResolve(projectStorybookDir, 'main.ts');
    let mainContent = await fs.readFile(lexMainPath, 'utf8');

    // Replace the stories path to look in the current project
    mainContent = mainContent.replace(
      /stories:\s*\[.*?\]/,
      `stories: ['${pathResolve(process.cwd(), 'src/**/*.stories.@(ts|tsx)')}', '${pathResolve(process.cwd(), 'src/**/*.mdx')}']`
    );

    // Replace the lexModule function to use absolute paths to Lex's node_modules
    const lexNodeModules = pathResolve(LexConfig.getLexDir(), 'node_modules');
    mainContent = mainContent.replace(
      /const lexModule = \(modulePath: string\) => resolve\(getLexNodeModulesPath\(\), modulePath\);/,
      `const lexModule = (modulePath: string) => resolve('${lexNodeModules}', modulePath);`
    );

    await fs.writeFile(projectMainPath, mainContent);

    // Copy preview.ts if it exists
    const lexPreviewPath = pathResolve(lexConfigDir, 'preview.ts');
    if(existsSync(lexPreviewPath)) {
      const previewContent = await fs.readFile(lexPreviewPath, 'utf8');
      await fs.writeFile(pathResolve(projectStorybookDir, 'preview.ts'), previewContent);
    }

    configDir = projectStorybookDir;
  }
  if(!existsSync(configDir)) {
    spinner.fail('Storybook configuration not found.');
    log(`Project config: ${projectConfigDir}`, 'info', quiet);
    log(`Lex config: ${lexConfigDir}`, 'info', quiet);
    log('Please run "npx storybook@latest init" to set up Storybook in your project, or ensure Lex has a valid .storybook configuration.', 'info', quiet);
    callback(1);
    return 1;
  }

  // Determine Storybook binary to use
  const storybookPath = resolveBinaryPath('storybook');

  if(!storybookPath) {
    log(`\n${cliName} Error: storybook binary not found in Lex's node_modules or monorepo root`, 'error', quiet);
    log('Please reinstall Lex or check your Storybook installation.', 'info', quiet);
    callback(1);
    return 1;
  }

  // Build Storybook arguments - Storybook v9 uses subcommands
  const storybookArgs = [staticBuild ? 'build' : 'dev'];
  // Always use the determined config directory
  storybookArgs.push('--config-dir', configDir);

  if(port) {
    storybookArgs.push('--port', port.toString());
  }

  if(open) {
    storybookArgs.push('--open');
  }

  if(staticBuild) {
    // For static build, we need to specify the output directory
    const outputDir = pathResolve(process.cwd(), 'storybook-static');
    storybookArgs.push('--output-dir', outputDir);
  }

  // Debug output
  if(!quiet) {
    log(`Config directory: ${configDir}`, 'info', quiet);
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
      stdio: 'pipe'
    });

    let outputBuffer = '';
    let urlFound = false;

    // Handle stdout
    storybookProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      outputBuffer += output;

      // Stop spinner and show output when we detect Storybook is ready
      if(!urlFound && (output.includes('Local:') || output.includes('http://localhost') || output.includes('Storybook'))) {
        spinner.succeed('Storybook development server is ready!');
        urlFound = true;
      }

      // Show output in real-time
      process.stdout.write(output);
    });

    // Handle stderr
    storybookProcess.stderr?.on('data', (data) => {
      const output = data.toString();
      process.stderr.write(output);
    });

    // Stop spinner after timeout if no URL found
    setTimeout(() => {
      if(!urlFound) {
        spinner.succeed('Storybook development server starting...');
        console.log('\nWaiting for Storybook to start...');
      }
    }, 5000);

    await storybookProcess;

    callback(0);
    return 0;
  } catch(error) {
    // Display error message
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);
    spinner.fail('There was an error while running storybook.');
    callback(1);
    return 1;
  }
};