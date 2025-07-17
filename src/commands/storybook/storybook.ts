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

const checkStorybookInitialization = (): boolean => {
  const projectConfigDir = pathResolve(process.cwd(), '.storybook');
  const lexConfigDir = pathResolve(LexConfig.getLexDir(), '.storybook');
  return existsSync(projectConfigDir) || existsSync(lexConfigDir);
};

export const storybook = async (cmd: StorybookOptions, callback: StorybookCallback = () => ({})): Promise<number> => {
  const {cliName = 'Lex', config, open = false, port, quiet, static: staticBuild = false, variables} = cmd;

  const spinner = createSpinner(quiet);

  log(`${cliName} starting Storybook...`, 'info', quiet);

  await LexConfig.parseConfig(cmd);

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

  spinner.start('Finding story files...');
  const storyFiles = findStoryFiles();

  if(storyFiles.length === 0) {
    spinner.fail('No story files found in the project.');
    log('Please create story files with .stories.ts/.stories.js extensions or in a stories/ directory.', 'info', quiet);
    callback(1);
    return 1;
  }

  spinner.succeed(`Found ${storyFiles.length} story file(s)`);

  if(!checkStorybookInitialization()) {
    spinner.fail('Storybook is not initialized in this project or in Lex.');
    log('Please run "npx storybook@latest init" to set up Storybook in your project, or ensure Lex has a valid .storybook configuration.', 'info', quiet);
    callback(1);
    return 1;
  }

  const projectConfigDir = pathResolve(process.cwd(), '.storybook');
  const lexConfigDir = pathResolve(LexConfig.getLexDir(), '.storybook');

  let configDir = config || (existsSync(projectConfigDir) ? projectConfigDir : lexConfigDir);

  if(!quiet) {
    log(`Project config dir: ${projectConfigDir} (exists: ${existsSync(projectConfigDir)})`, 'info', quiet);
    log(`Lex config dir: ${lexConfigDir} (exists: ${existsSync(lexConfigDir)})`, 'info', quiet);
    log(`Initial config dir: ${configDir}`, 'info', quiet);
  }

  if(configDir === lexConfigDir) {
    if(!quiet) {
      log('Using Lex config, will create temporary config in project .storybook directory', 'info', quiet);
    }
    const projectStorybookDir = pathResolve(process.cwd(), '.storybook');

    const fs = await import('fs/promises');
    await fs.mkdir(projectStorybookDir, {recursive: true});

    const lexMainPath = pathResolve(lexConfigDir, 'main.ts');
    const projectMainPath = pathResolve(projectStorybookDir, 'main.ts');
    let mainContent = await fs.readFile(lexMainPath, 'utf8');

    mainContent = mainContent.replace(
      /stories:\s*\[.*?\]/,
      `stories: ['${pathResolve(process.cwd(), 'src/**/*.stories.@(ts|tsx)')}', '${pathResolve(process.cwd(), 'src/**/*.mdx')}']`
    );

    const lexNodeModules = pathResolve(LexConfig.getLexDir(), 'node_modules');
    mainContent = mainContent.replace(
      /const lexModule = \(modulePath: string\) => resolve\(getLexNodeModulesPath\(\), modulePath\);/,
      `const lexModule = (modulePath: string) => resolve('${lexNodeModules}', modulePath);`
    );

    await fs.writeFile(projectMainPath, mainContent);

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

  const storybookPath = resolveBinaryPath('storybook');

  if(!storybookPath) {
    log(`\n${cliName} Error: storybook binary not found in Lex's node_modules or monorepo root`, 'error', quiet);
    log('Please reinstall Lex or check your Storybook installation.', 'info', quiet);
    callback(1);
    return 1;
  }

  const storybookArgs = [staticBuild ? 'build' : 'dev'];
  storybookArgs.push('--config-dir', configDir);

  if(port) {
    storybookArgs.push('--port', port.toString());
  }

  if(open) {
    storybookArgs.push('--open');
  }

  if(staticBuild) {
    const outputDir = pathResolve(process.cwd(), 'storybook-static');
    storybookArgs.push('--output-dir', outputDir);
  }

  if(!quiet) {
    log(`Config directory: ${configDir}`, 'info', quiet);
  }

  try {
    spinner.start(staticBuild ? 'Building static Storybook...' : 'Starting Storybook development server...');

    const storybookProcess = execa(storybookPath as any, storybookArgs, {
      encoding: 'utf8',
      env: {
        ...process.env,
        LEX_QUIET: quiet,
        STORYBOOK_OPEN: open
      } as any,
      stdio: 'pipe'
    });

    let outputBuffer = '';
    let urlFound = false;

    storybookProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      outputBuffer += output;

      if(!urlFound && (output.includes('Local:') || output.includes('http://localhost') || output.includes('Storybook'))) {
        spinner.succeed('Storybook development server is ready!');
        urlFound = true;
      }

      process.stdout.write(output);
    });

    storybookProcess.stderr?.on('data', (data) => {
      const output = data.toString();
      process.stderr.write(output);
    });

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
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);
    spinner.fail('There was an error while running storybook.');
    callback(1);
    return 1;
  }
};