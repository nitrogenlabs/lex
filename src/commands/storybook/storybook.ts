import chalk from 'chalk';
import {execa} from 'execa';
import {existsSync} from 'fs';
import {sync as globSync} from 'glob';
import {resolve as pathResolve} from 'path';

import {LexConfig} from '../../LexConfig.js';
import {createSpinner} from '../../utils/app.js';
import {findTailwindCssPath, resolveBinaryPath} from '../../utils/file.js';
import {log} from '../../utils/log.js';

export interface StorybookOptions {
  readonly cliName?: string;
  readonly config?: string;
  readonly open?: boolean;
  readonly port?: number;
  readonly quiet?: boolean;
  readonly static?: boolean;
  readonly useLexConfig?: boolean;
  readonly variables?: string;
  readonly verbose?: boolean;
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

const extractProgressPercentage = (output: string): number | null => {
  const lines = output.split('\n');
  for(const line of lines) {
    if(line.includes('[webpack.Progress]') && line.includes('%')) {
      const percentageMatch = line.match(/(\d+)%/);
      if(percentageMatch) {
        return parseInt(percentageMatch[1]);
      }
    }
  }
  return null;
};

const filterAndBeautifyOutput = (output: string, isVerbose: boolean): string => {
  if(isVerbose) {
    return output;
  }

  const lines = output.split('\n');
  const filteredLines = lines.filter((line) => {
    if(line.includes('[webpack.Progress]')) {
      return false;
    }

    if(line.includes('Storybook') ||
      line.includes('Local:') ||
      line.includes('http://localhost') ||
      line.includes('info =>') ||
      line.includes('Starting') ||
      line.includes('ready') ||
      line.includes('error') ||
      line.includes('warning')) {
      return true;
    }

    return true;
  });

  return filteredLines.join('\n');
};

const beautifyOutput = (output: string): string => output
  .replace(/Storybook v[\d.]+/g, chalk.cyan('$&'))
  .replace(/info =>/g, chalk.blue('info =>'))
  .replace(/Local:/g, chalk.green('Local:'))
  .replace(/On your network:/g, chalk.green('On your network:'))
  .replace(/Storybook.*started/g, chalk.green('$&'))
  .replace(/Storybook.*ready/g, chalk.green('$&'))
  .replace(/error/g, chalk.red('$&'))
  .replace(/warning/g, chalk.yellow('$&'))
  .replace(/(\d+)%/g, chalk.magenta('$1%'));

export const storybook = async (cmd: StorybookOptions, callback: StorybookCallback = () => ({})): Promise<number> => {
  const {cliName = 'Lex', config, open = false, port = 6007, quiet, static: staticBuild = false, useLexConfig = false, variables, verbose = false} = cmd;

  const spinner = createSpinner(quiet);

  log(chalk.cyan(`${cliName} starting Storybook...`), 'info', quiet);

  await LexConfig.parseConfig(cmd);

  let variablesObj: object = {NODE_ENV: 'development'};

  if(variables) {
    try {
      variablesObj = JSON.parse(variables);
    } catch (_error) {
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

  const tailwindCssPath = findTailwindCssPath();

  console.log({tailwindCssPath});
  if(tailwindCssPath) {
    if(!quiet) {
      log(chalk.green(`✓ Tailwind CSS integration detected: ${tailwindCssPath}`), 'info', quiet);
    }
  } else {
    if(!quiet) {
      log(chalk.yellow('⚠ No Tailwind CSS file found in project'), 'info', quiet);
      log(chalk.gray('Create a tailwind.css file with @tailwind directives for full Tailwind support'), 'info', quiet);
    }
  }

  if(!checkStorybookInitialization()) {
    spinner.fail('Storybook is not initialized in this project or in Lex.');
    log('Please run "npx storybook@latest init" to set up Storybook in your project, or ensure Lex has a valid .storybook configuration.', 'info', quiet);
    callback(1);
    return 1;
  }

  const projectConfigDir = pathResolve(process.cwd(), '.storybook');
  const lexConfigDir = pathResolve(LexConfig.getLexDir(), '.storybook');

  let configDir = config;
  if(!configDir) {
    configDir = lexConfigDir;
    if(!useLexConfig && existsSync(projectConfigDir)) {
      configDir = projectConfigDir;
    }
  }

  if(!quiet) {
    log(chalk.gray(`Project config dir: ${projectConfigDir} (exists: ${existsSync(projectConfigDir)})`), 'info', quiet);
    log(chalk.gray(`Lex config dir: ${lexConfigDir} (exists: ${existsSync(lexConfigDir)})`), 'info', quiet);
    if(useLexConfig) {
      log(chalk.blue('Using Lex Storybook configuration (--use-lex-config flag)'), 'info', quiet);
    }
    log(chalk.gray(`Initial config dir: ${configDir}`), 'info', quiet);
  }

  if(configDir === lexConfigDir) {
    if(!quiet) {
      log(chalk.blue('Using Lex config, will create temporary config in project .storybook directory'), 'info', quiet);
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

    const lexPreviewPath = pathResolve(lexConfigDir, 'preview.tsx');
    if(existsSync(lexPreviewPath)) {
      const previewContent = await fs.readFile(lexPreviewPath, 'utf8');
      await fs.writeFile(pathResolve(projectStorybookDir, 'preview.tsx'), previewContent);
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
    log(chalk.gray(`Config directory: ${configDir}`), 'info', quiet);
  }

  process.env.TAILWIND_CSS_PATH = tailwindCssPath;

  try {
    spinner.start(staticBuild ? 'Building static Storybook...' : 'Starting Storybook development server...');

    const storybookProcess = execa(storybookPath as any, storybookArgs, {
      encoding: 'utf8',
      env: {
        ...process.env,
        LEX_QUIET: quiet,
        LEX_VERBOSE: verbose,
        STORYBOOK_OPEN: open,
        ...(tailwindCssPath && {TAILWIND_CSS_PATH: tailwindCssPath})
      } as any,
      stdio: 'pipe'
    });

    let urlFound = false;
    let lastProgressPercentage = 0;

    storybookProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      const progressPercentage = extractProgressPercentage(output);

      if(progressPercentage !== null && progressPercentage !== lastProgressPercentage) {
        lastProgressPercentage = progressPercentage;
        const action = staticBuild ? 'Building' : 'Starting';
        (spinner as any).text = `${action} Storybook... ${progressPercentage}%`;
        process.stdout.write(`\nWebpack Progress: ${chalk.magenta(`${progressPercentage}%`)}\n`);
      }

      const filteredOutput = filterAndBeautifyOutput(output, verbose);
      const beautifiedOutput = beautifyOutput(filteredOutput);

      if(!urlFound && (output.includes('Local:') || output.includes('http://localhost') || output.includes('Storybook'))) {
        spinner.succeed(chalk.green('Storybook development server is ready!'));
        urlFound = true;
      }

      if(filteredOutput.trim()) {
        process.stdout.write(beautifiedOutput);
      }
    });

    storybookProcess.stderr?.on('data', (data) => {
      const output = data.toString();
      const filteredOutput = filterAndBeautifyOutput(output, verbose);
      const beautifiedOutput = beautifyOutput(filteredOutput);

      if(filteredOutput.trim()) {
        process.stderr.write(beautifiedOutput);
      }
    });

    try {
      await storybookProcess;
      if(!urlFound) {
        spinner.succeed(chalk.green('Storybook development server started.'));
      }
      callback(0);
      return 0;
    } catch (error) {
      spinner.fail(chalk.red('There was an error while running storybook.'));
      log(`\n${cliName} Error: ${error.message}`, 'error', quiet);
      callback(1);
      return 1;
    }
  } catch (error) {
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);
    spinner.fail('There was an error while running storybook.');
    callback(1);
    return 1;
  }
};