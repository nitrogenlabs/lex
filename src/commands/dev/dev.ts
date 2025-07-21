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
import {createSpinner, createProgressBar, handleWebpackProgress, removeFiles} from '../../utils/app.js';
import {resolveWebpackPaths} from '../../utils/file.js';
import {log} from '../../utils/log.js';

let currentFilename: string;
let currentDirname: string;

try {
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
  readonly open?: boolean;
  readonly quiet?: boolean;
  readonly remove?: boolean;
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

    // Check if cache is older than 1 week (7 days * 24 hours * 60 minutes * 60 seconds * 1000 milliseconds)
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
  // Check cache first unless force refresh is requested
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

        // Private IP ranges
        if(ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.')) {
          if(!addresses.private) {
            addresses.private = ip;
          }
        } else {
          // Public IP (not in private ranges)
          if(!addresses.public) {
            addresses.public = ip;
          }
        }
      }
    }
  }

  return addresses;
};

const displayServerStatus = (port: number = 7001, host: string = 'localhost', quiet: boolean, publicIp?: string) => {
  if(quiet) {
    return;
  }

  const addresses = getNetworkAddresses();
  const localUrl = `http://localhost:${port}`;
  const privateUrl = addresses.private ? `http://${addresses.private}:${port}` : null;
  const publicUrl = publicIp ? `http://${publicIp}:${port}` : (addresses.public ? `http://${addresses.public}:${port}` : null);

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
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      backgroundColor: '#1a1a1a'
    }
  );

  console.log(`\n${statusBox}\n`);
};

export const dev = async (cmd: DevOptions, callback: DevCallback = () => ({})): Promise<number> => {
  const {bundleAnalyzer, cliName = 'Lex', config, open = false, quiet, remove, usePublicIp, variables} = cmd;

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

  let webpackConfig: string;
  let webpackPath: string;

  if(config) {
    const isRelativeConfig: boolean = config.substr(0, 2) === './';
    webpackConfig = isRelativeConfig ? pathResolve(process.cwd(), config) : config;
  } else {
    const {webpackConfig: resolvedConfig} = resolveWebpackPaths(currentDirname);
    webpackConfig = resolvedConfig;
  }

  const {webpackPath: resolvedPath} = resolveWebpackPaths(currentDirname);
  webpackPath = resolvedPath;

  const webpackOptions: string[] = [
    '--color',
    '--watch',
    '--config', webpackConfig
  ];

  if(bundleAnalyzer) {
    webpackOptions.push('--bundleAnalyzer');
  }

  try {
    const finalWebpackOptions = webpackPath === 'npx' ? ['webpack', ...webpackOptions] : webpackOptions;

    spinner.start('Starting development server...');

    const childProcess = execa(webpackPath, finalWebpackOptions, {
      encoding: 'utf8',
      env: {
        LEX_QUIET: quiet,
        WEBPACK_DEV_OPEN: open
      },
      stdio: 'pipe'
    } as any);

    let serverStarted = false;
    let detectedPort = 7001;

    childProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();

      handleWebpackProgress(output, spinner, quiet, '🚀', 'Webpack Building');

      if(!serverStarted && (output.includes('Local:') || output.includes('webpack compiled') || output.includes('webpack-plugin-serve') || output.includes('http://localhost') || output.includes('listening on port'))) {
        serverStarted = true;
        spinner.succeed('Development server started.');

        // Try multiple patterns to detect the port
        const portMatch = output.match(/Local:\s*http:\/\/[^:]+:(\d+)/) ||
          output.match(/http:\/\/localhost:(\d+)/) ||
          output.match(/port:\s*(\d+)/) ||
          output.match(/listening on port (\d+)/) ||
          output.match(/WebpackPluginServe listening on port (\d+)/);
        if(portMatch) {
          detectedPort = parseInt(portMatch[1], 10);
        }

        displayServerStatus(detectedPort, 'localhost', quiet);
        fetchPublicIp(usePublicIp).then((publicIp) => {
          if(publicIp) {
            displayServerStatus(detectedPort, 'localhost', quiet, publicIp);
          }
        });
      }
    });

    childProcess.stderr?.on('data', (data: Buffer) => {
      const output = data.toString();

      handleWebpackProgress(output, spinner, quiet, '🚀', 'Webpack Building');

      if(!serverStarted && (output.includes('Local:') || output.includes('webpack compiled') || output.includes('webpack-plugin-serve') || output.includes('http://localhost') || output.includes('listening on port'))) {
        serverStarted = true;
        spinner.succeed('Development server started.');

        // Try multiple patterns to detect the port
        const portMatch = output.match(/Local:\s*http:\/\/[^:]+:(\d+)/) ||
          output.match(/http:\/\/localhost:(\d+)/) ||
          output.match(/port:\s*(\d+)/) ||
          output.match(/listening on port (\d+)/) ||
          output.match(/WebpackPluginServe listening on port (\d+)/);
        if(portMatch) {
          detectedPort = parseInt(portMatch[1], 10);
        }

        displayServerStatus(detectedPort, 'localhost', quiet);
        fetchPublicIp(usePublicIp).then((publicIp) => {
          if(publicIp) {
            displayServerStatus(detectedPort, 'localhost', quiet, publicIp);
          }
        });
      }
    });

    setTimeout(() => {
      if(!serverStarted) {
        spinner.succeed('Development server started.');
        displayServerStatus(detectedPort, 'localhost', quiet);
        fetchPublicIp(usePublicIp).then((publicIp) => {
          if(publicIp) {
            displayServerStatus(detectedPort, 'localhost', quiet, publicIp);
          }
        });
      }
    }, 5000);

    await childProcess;

    if(!serverStarted) {
      spinner.succeed('Development server started.');
      displayServerStatus(detectedPort, 'localhost', quiet);
      fetchPublicIp(usePublicIp).then((publicIp) => {
        if(publicIp) {
          displayServerStatus(detectedPort, 'localhost', quiet, publicIp);
        }
      });
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