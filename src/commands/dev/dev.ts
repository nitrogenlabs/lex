/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import boxen from 'boxen';
import chalk from 'chalk';
import {existsSync, readFileSync, writeFileSync, mkdirSync} from 'fs';
import https from 'https';
import {networkInterfaces, homedir} from 'os';
import {join} from 'path';
import {createServer as createViteServer} from 'vite';

import {LexConfig} from '../../LexConfig.js';
import {createSpinner, removeFiles} from '../../utils/app.js';
import {log} from '../../utils/log.js';
import {processTranslations} from '../../utils/translations.js';
import {createLexViteConfig} from '../../utils/vite/config.js';

export interface DevOptions {
  readonly bundleAnalyzer?: boolean;
  readonly cliName?: string;
  readonly open?: boolean;
  readonly port?: number;
  readonly quiet?: boolean;
  readonly remove?: boolean;
  readonly translations?: boolean;
  readonly usePublicIp?: boolean;
  readonly variables?: string;
}

export type DevCallback = (status: number) => void;

// default port used by the development server when none is provided
export const DEFAULT_DEV_PORT = 3000;

interface PublicIpCache {
  ip: string;
  timestamp: number;
}

const parsePort = (portValue: unknown): number | undefined => {
  if(portValue === undefined || portValue === null || portValue === '') {
    return undefined;
  }

  const parsed = Number(portValue);
  if(Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  return undefined;
};

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
    private: null as string | null,
    public: null as string | null
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

const displayServerStatus = (port: number = DEFAULT_DEV_PORT, quiet: boolean = false, publicIp?: string) => {
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
  const {bundleAnalyzer, cliName = 'Lex', open = false, port: cliPort, quiet, remove, translations = false, usePublicIp, variables} = cmd;

  const spinner = createSpinner(quiet);

  log(`${cliName} start development server...`, 'info', quiet);

  await LexConfig.parseConfig(cmd);

  const {dev: devConfig, outputFullPath, useTypescript} = LexConfig.config;
  const finalPort = parsePort(cliPort) ?? parsePort(devConfig?.port) ?? DEFAULT_DEV_PORT;

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

  try {
    spinner.start('Starting development server...');
    const server = await createViteServer(createLexViteConfig({
      analyze: bundleAnalyzer,
      command: 'serve',
      mode: 'development',
      open,
      port: finalPort,
      quiet
    }));
    await server.listen();
    spinner.succeed('Development server started.');

    if(usePublicIp) {
      const publicIp = await fetchPublicIp(usePublicIp);
      displayServerStatus(finalPort, quiet, publicIp);
    } else {
      displayServerStatus(finalPort, quiet);
    }

    return 0;
  } catch(error) {
    const serverError = error instanceof Error ? error : new Error(String(error));
    log(`\n${cliName} Error: ${serverError.message}`, 'error', quiet);

    spinner.fail('There was an error while running Vite.');

    callback(1);
    return 1;
  }
};
