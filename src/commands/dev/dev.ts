/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import boxen from 'boxen';
import chalk from 'chalk';
import {execa} from 'execa';
import {existsSync, readFileSync, writeFileSync, mkdirSync} from 'fs';
import https from 'https';
import {networkInterfaces, homedir} from 'os';
import {dirname, resolve as pathResolve, join} from 'path';

import {LexConfig} from '../../LexConfig.js';
import {createSpinner, handleWebpackProgress, removeFiles} from '../../utils/app.js';
import {resolveWebpackPaths} from '../../utils/file.js';
import {log} from '../../utils/log.js';
import {processTranslations} from '../../utils/translations.js';

let currentFilename: string;
let currentDirname: string;

try {
  // eslint-disable-next-line no-eval
  currentFilename = eval('require("url").fileURLToPath(import.meta.url)');
  currentDirname = dirname(currentFilename);
} catch{
  currentFilename = process.cwd();
  currentDirname = process.cwd();
}

export interface DevOptions {
  readonly bundleAnalyzer?: boolean;
  readonly cliName?: string;
  readonly config?: string;
  readonly format?: string;
  readonly open?: boolean;
  readonly port?: number;
  readonly quiet?: boolean;
  readonly remove?: boolean;
  readonly translations?: boolean;
  readonly usePublicIp?: boolean;
  readonly variables?: string;
}

export type DevCallback = (status: number) => void;

interface PublicIpCache {
  ip: string;
  timestamp: number;
}

const getCacheDir = (): string => {
  const cacheDir = join(homedir(), '.lex-cache');
  if(!existsSync(cacheDir)) {
    mkdirSync(cacheDir, {recursive: true});
  }
  return cacheDir;
};

const getCachePath = (): string => join(getCacheDir(), 'public-ip.json');

const readPublicIpCache = (): PublicIpCache | null => {
  const cachePath = getCachePath();
  if(!existsSync(cachePath)) {
    return null;
  }

  try {
    const cacheData = readFileSync(cachePath, 'utf8');
    const cache: PublicIpCache = JSON.parse(cacheData);
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

    if(Date.now() - cache.timestamp > oneWeekMs) {
      return null;
    }

    return cache;
  } catch{
    return null;
  }
};

const writePublicIpCache = (ip: string): void => {
  const cachePath = getCachePath();
  const cache: PublicIpCache = {
    ip,
    timestamp: Date.now()
  };
  writeFileSync(cachePath, JSON.stringify(cache, null, 2));
};

const fetchPublicIp = (forceRefresh: boolean = false): Promise<string | undefined> => new Promise((resolve) => {
  if(!forceRefresh) {
    const cached = readPublicIpCache();
    if(cached) {
      resolve(cached.ip);
      return;
    }
  }

  https.get('https://api.ipify.org', (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      const ip = data.trim();
      if(ip) {
        writePublicIpCache(ip);
      }
      resolve(ip);
    });
  }).on('error', () => resolve(undefined));
});

const getNetworkAddresses = () => {
  const interfaces = networkInterfaces();
  const addresses = {
    local: 'localhost',
    private: null,
    public: null
  };

  for(const name of Object.keys(interfaces)) {
    const networkInterface = interfaces[name];
    if(!networkInterface) {
      continue;
    }

    for(const iface of networkInterface) {
      if(iface.family === 'IPv4' && !iface.internal) {
        const ip = iface.address;

        if(ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.')) {
          if(!addresses.private) {
            addresses.private = ip;
          }
        } else {
          if(!addresses.public) {
            addresses.public = ip;
          }
        }
      }
    }
  }

  return addresses;
};

const displayServerStatus = (port: number = 3000, quiet: boolean, publicIp?: string) => {
  if(quiet) {
    return;
  }

  const addresses = getNetworkAddresses();
  const localUrl = `http://localhost:${port}`;
  const privateUrl = addresses.private ? `http://${addresses.private}:${port}` : null;
  let publicUrl = null;
  if(publicIp) {
    publicUrl = `http://${publicIp}:${port}`;
  } else if(addresses.public) {
    publicUrl = `http://${addresses.public}:${port}`;
  }

  let urlLines = `${chalk.green('Local:')}     ${chalk.underline(localUrl)}\n`;

  if(privateUrl) {
    urlLines += `${chalk.green('Private:')}   ${chalk.underline(privateUrl)}\n`;
  }

  if(publicUrl) {
    urlLines += `${chalk.green('Public:')}    ${chalk.underline(publicUrl)}\n`;
  }

  const statusBox = boxen(
    `${chalk.cyan.bold('🚀 Development Server Running')}\n\n${urlLines}\n` +
    `${chalk.yellow('Press Ctrl+C to stop the server')}`,
    {
      backgroundColor: '#1a1a1a',
      borderColor: 'cyan',
      borderStyle: 'round',
      margin: 1,
      padding: 1
    }
  );

  // eslint-disable-next-line no-console
  console.log(`\n${statusBox}\n`);
};

export const dev = async (cmd: DevOptions, callback: DevCallback = () => ({})): Promise<number> => {
  const {bundleAnalyzer, cliName = 'Lex', config, format = 'esm', open = false, port = 3000, quiet, remove, translations = false, usePublicIp, variables} = cmd;

  const spinner = createSpinner(quiet);

  log(`${cliName} start development server...`, 'info', quiet);

  await LexConfig.parseConfig(cmd);

  const {outputFullPath, useTypescript} = LexConfig.config;

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

  if(useTypescript) {
    LexConfig.checkTypescriptConfig();
  }

  if(remove) {
    spinner.start('Cleaning output directory...');

    await removeFiles(outputFullPath || '');

    spinner.succeed('Successfully cleaned output directory!');
  }

  if(translations) {
    spinner.start('Processing translations...');

    try {
      const sourcePath = LexConfig.config.sourceFullPath || process.cwd();
      const outputPath = LexConfig.config.outputFullPath || 'lib';

      await processTranslations(sourcePath, outputPath, quiet);
      spinner.succeed('Translations processed successfully!');
    } catch(translationError) {
      log(`\n${cliName} Error: Failed to process translations: ${translationError.message}`, 'error', quiet);
      spinner.fail('Failed to process translations.');
      callback(1);
      return 1;
    }
  }

  let webpackConfig: string;

  if(config) {
    const isRelativeConfig: boolean = config.substr(0, 2) === './';
    webpackConfig = isRelativeConfig ? pathResolve(process.cwd(), config) : config;
  } else {
    const {webpackConfig: resolvedConfig} = resolveWebpackPaths(currentDirname);
    webpackConfig = resolvedConfig;
  }

  const {webpackPath} = resolveWebpackPaths(currentDirname);

  const webpackOptions: string[] = [
    '--color',
    '--watch',
    '--config', webpackConfig
  ];

  if(bundleAnalyzer) {
    webpackOptions.push('--bundleAnalyzer');
  }

  if(port !== 3000) {
    webpackOptions.push('--port', port.toString());
  }

  try {
    let executablePath = webpackPath;
    let finalWebpackOptions: string[];

    if(webpackPath === 'npx') {
      finalWebpackOptions = ['webpack', ...webpackOptions];
    } else if(webpackPath.endsWith('.js')) {
      executablePath = 'node';
      finalWebpackOptions = [webpackPath, ...webpackOptions];
    } else {
      finalWebpackOptions = webpackOptions;
    }

    spinner.start('Starting development server...');

    const childProcess = execa(executablePath, finalWebpackOptions, {
      encoding: 'utf8',
      env: {
        LEX_QUIET: quiet,
        WEBPACK_DEV_OPEN: open
      },
      stdio: 'pipe'
    } as any);

    let serverStarted = false;
    let statusShown = false;
    const showStatusOnce = (portToShow: number) => {
      if(statusShown) {
        return;
      }
      statusShown = true;
      if(usePublicIp) {
        fetchPublicIp(usePublicIp).then((publicIp) => {
          displayServerStatus(portToShow, quiet, publicIp);
        });
      } else {
        displayServerStatus(portToShow, quiet);
      }
    };
    let detectedPort = 3000;

    childProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();

      handleWebpackProgress(output, spinner, quiet, '🚀', 'Webpack Building');

      if(!serverStarted && (output.includes('Local:') || output.includes('webpack compiled') || output.includes('webpack-plugin-serve') || output.includes('http://localhost') || output.includes('listening on port'))) {
        serverStarted = true;
        spinner.succeed('Development server started.');

        const portMatch = output.match(/Local:\s*http:\/\/[^:]+:(\d+)/) ||
          output.match(/http:\/\/localhost:(\d+)/) ||
          output.match(/port:\s*(\d+)/) ||
          output.match(/listening on port (\d+)/) ||
          output.match(/WebpackPluginServe listening on port (\d+)/);
        if(portMatch) {
          detectedPort = parseInt(portMatch[1]);
        }

        showStatusOnce(detectedPort);
      }
    });

    childProcess.stderr?.on('data', (data: Buffer) => {
      const output = data.toString();

      handleWebpackProgress(output, spinner, quiet, '🚀', 'Webpack Building');

      if(!serverStarted && (output.includes('Local:') || output.includes('webpack compiled') || output.includes('webpack-plugin-serve') || output.includes('http://localhost') || output.includes('listening on port'))) {
        serverStarted = true;
        spinner.succeed('Development server started.');

        const portMatch = output.match(/Local:\s*http:\/\/[^:]+:(\d+)/) ||
          output.match(/http:\/\/localhost:(\d+)/) ||
          output.match(/port:\s*(\d+)/) ||
          output.match(/listening on port (\d+)/) ||
          output.match(/WebpackPluginServe listening on port (\d+)/);
        if(portMatch) {
          detectedPort = parseInt(portMatch[1]);
        }

        showStatusOnce(detectedPort);
      }
    });

    setTimeout(() => {
      if(!serverStarted) {
        spinner.succeed('Development server started.');
        showStatusOnce(detectedPort);
      }
    }, 5000);

    await childProcess;

    if(!serverStarted) {
      spinner.succeed('Development server started.');
      showStatusOnce(detectedPort);
    }

    callback(0);
    return 0;
  } catch(error) {
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    spinner.fail('There was an error while running Webpack.');

    callback(1);
    return 1;
  }
};