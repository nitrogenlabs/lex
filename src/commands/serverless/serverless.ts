/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import boxen from 'boxen';
import chalk from 'chalk';
import {readFileSync, existsSync, mkdirSync, writeFileSync} from 'fs';
import {createServer} from 'http';
import https, {createServer as createHttpsServer} from 'https';
import {networkInterfaces, homedir} from 'os';
import {dirname, resolve as pathResolve, join} from 'path';
import {WebSocketServer} from 'ws';

import {LexConfig} from '../../LexConfig.js';
import {createSpinner, removeFiles} from '../../utils/app.js';
import {log} from '../../utils/log.js';

export interface ServerlessOptions {
  readonly cliName?: string;
  readonly config?: string;
  readonly host?: string;
  readonly httpPort?: number;
  readonly httpsPort?: number;
  readonly wsPort?: number;
  readonly quiet?: boolean;
  readonly remove?: boolean;
  readonly variables?: string;
  readonly usePublicIp?: boolean;
}

export type ServerlessCallback = (status: number) => void;

interface PublicIpCache {
  ip: string;
  timestamp: number;
}

interface ServerlessHandler {
  readonly handler: string;
  readonly events?: Array<{
    readonly http?: {
      readonly path?: string;
      readonly method?: string;
      readonly cors?: boolean;
    };
    readonly websocket?: {
      readonly route?: string;
    };
  }>;
}

interface ServerlessConfig {
  readonly functions?: Record<string, ServerlessHandler>;
  readonly custom?: {
    readonly 'serverless-offline'?: {
      readonly httpPort?: number;
      readonly httpsPort?: number;
      readonly wsPort?: number;
      readonly host?: string;
      readonly cors?: boolean;
    };
  };
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

    // Check if cache is older than 1 week
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    if(Date.now() - cache.timestamp > oneWeekMs) {
      return null;
    }

    return cache;
  } catch {
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

const displayServerStatus = (httpPort: number, httpsPort: number, wsPort: number, host: string, quiet: boolean, publicIp?: string) => {
  if(quiet) {
    return;
  }

  const addresses = getNetworkAddresses();
  const httpUrl = `http://${host}:${httpPort}`;
  const httpsUrl = `https://${host}:${httpsPort}`;
  const wsUrl = `ws://${host}:${wsPort}`;
  const wssUrl = `wss://${host}:${wsPort}`;

  let urlLines = `${chalk.green('HTTP:')}      ${chalk.underline(httpUrl)}\n`;
  urlLines += `${chalk.green('HTTPS:')}     ${chalk.underline(httpsUrl)}\n`;
  urlLines += `${chalk.green('WebSocket:')} ${chalk.underline(wsUrl)}\n`;
  urlLines += `${chalk.green('WSS:')}       ${chalk.underline(wssUrl)}\n`;

  if(publicIp) {
    urlLines += `\n${chalk.green('Public:')}    ${chalk.underline(`http://${publicIp}:${httpPort}`)}\n`;
  }

  const statusBox = boxen(
    `${chalk.cyan.bold('🚀 Serverless Development Server Running')}\n\n${urlLines}\n` +
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

const loadHandler = async (handlerPath: string, outputDir: string) => {
  try {
    const fullPath = pathResolve(outputDir, handlerPath);
    log(`Loading handler from: ${fullPath}`, 'info', false);

    if(!existsSync(fullPath)) {
      throw new Error(`Handler file not found: ${fullPath}`);
    }

    // Dynamic import of the handler
    const handlerModule = await import(fullPath);
    log(`Handler module loaded: ${Object.keys(handlerModule)}`, 'info', false);

    const handler = handlerModule.default || handlerModule.handler || handlerModule;
    log(`Handler found: ${typeof handler}`, 'info', false);

    return handler;
  } catch(error) {
    log(`Error loading handler ${handlerPath}: ${error.message}`, 'error', false);
    return null;
  }
};

const captureConsoleLogs = (handler: Function, quiet: boolean) => {
  if(quiet) {
    return handler;
  }

  return async (event: any, context: any) => {
    // Capture console.log, console.error, etc.
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleInfo = console.info;

    const logs: string[] = [];

    console.log = (...args: any[]) => {
      logs.push(`[LOG] ${args.join(' ')}`);
      originalConsoleLog(...args);
    };

    console.error = (...args: any[]) => {
      logs.push(`[ERROR] ${args.join(' ')}`);
      originalConsoleError(...args);
    };

    console.warn = (...args: any[]) => {
      logs.push(`[WARN] ${args.join(' ')}`);
      originalConsoleWarn(...args);
    };

    console.info = (...args: any[]) => {
      logs.push(`[INFO] ${args.join(' ')}`);
      originalConsoleInfo(...args);
    };

    try {
      const result = await handler(event, context);

      // Output captured logs
      if(logs.length > 0) {
        console.log(chalk.gray('--- Handler Console Output ---'));
        logs.forEach((log) => console.log(chalk.gray(log)));
        console.log(chalk.gray('--- End Handler Console Output ---'));
      }

      return result;
    } finally {
      // Restore original console methods
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.info = originalConsoleInfo;
    }
  };
};

const createHttpServer = (config: ServerlessConfig, outputDir: string, httpPort: number, host: string, quiet: boolean) => {
  const server = createServer(async (req, res) => {
    try {
      const url = req.url || '/';
      const method = req.method || 'GET';

      log(`${method} ${url}`, 'info', false);

      // Handle CORS preflight requests - respond to all OPTIONS requests
      if(method === 'OPTIONS') {
        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400'
        });
        res.end();
        return;
      }

      // Set CORS headers for all responses
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');

      // Find matching function
      let matchedFunction = null;
      let matchedPath = null;

      log(`Looking for function matching: ${method} ${url}`, 'info', false);

      if(config.functions) {
        for(const [functionName, functionConfig] of Object.entries(config.functions)) {
          if(functionConfig.events) {
            for(const event of functionConfig.events) {
              if(event.http) {
                const eventPath = event.http.path || '/';
                const eventMethod = event.http.method || 'GET';

                log(`Checking function ${functionName}: ${eventMethod} ${eventPath}`, 'info', false);

                if(eventPath === url && eventMethod === method) {
                  matchedFunction = functionName;
                  matchedPath = eventPath;
                  log(`Found matching function: ${functionName}`, 'info', false);
                  break;
                }
              }
            }
          }
          if(matchedFunction) {
            break;
          }
        }
      }

      if(!matchedFunction) {
        log(`No function found for ${method} ${url}`, 'warn', false);
      }

      if(matchedFunction && config.functions[matchedFunction]) {
        const handler = await loadHandler(config.functions[matchedFunction].handler, outputDir);

        if(handler) {
          // Wrap handler with console log capture
          const wrappedHandler = captureConsoleLogs(handler, quiet);

          // Simulate AWS Lambda event and context
          const event = {
            httpMethod: method,
            path: url,
            headers: req.headers,
            queryStringParameters: {},
            body: null
          };

          const context = {
            functionName: matchedFunction,
            functionVersion: '$LATEST',
            invokedFunctionArn: `arn:aws:lambda:us-east-1:123456789012:function:${matchedFunction}`,
            memoryLimitInMB: '128',
            awsRequestId: 'test-request-id',
            logGroupName: `/aws/lambda/${matchedFunction}`,
            logStreamName: 'test-log-stream',
            getRemainingTimeInMillis: () => 30000
          };

          // Parse query parameters
          const urlObj = new URL(url, `http://${host}`);
          event.queryStringParameters = Object.fromEntries(urlObj.searchParams);

          // Parse body for POST/PUT requests
          if(['POST', 'PUT', 'PATCH'].includes(method)) {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk.toString();
            });
            req.on('end', async () => {
              event.body = body;

              try {
                const result = await wrappedHandler(event, context);

                res.writeHead(200, {
                  'Content-Type': 'application/json'
                });

                res.end(JSON.stringify(result));
              } catch(error) {
                log(`Handler error: ${error.message}`, 'error', false);
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({error: error.message}));
              }
            });
            return;
          }
          try {
            const result = await wrappedHandler(event, context);

            res.writeHead(200, {
              'Content-Type': 'application/json'
            });

            res.end(JSON.stringify(result));
          } catch(error) {
            log(`Handler error: ${error.message}`, 'error', false);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: error.message}));
          }
        } else {
          res.writeHead(404, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({error: 'Handler not found'}));
        }
      } else {
        res.writeHead(404, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Function not found'}));
      }
    } catch(error) {
      log(`Server error: ${error.message}`, 'error', false);
      res.writeHead(500, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({error: error.message}));
    }
  });

  return server;
};

const createWebSocketServer = (config: ServerlessConfig, outputDir: string, wsPort: number, quiet: boolean) => {
  const wss = new WebSocketServer({port: wsPort});

  wss.on('connection', async (ws, req) => {
    log(`WebSocket connection established: ${req.url}`, 'info', false);

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());

        // Find matching WebSocket function
        let matchedFunction = null;

        if(config.functions) {
          for(const [functionName, functionConfig] of Object.entries(config.functions)) {
            if(functionConfig.events) {
              for(const event of functionConfig.events) {
                if(event.websocket) {
                  const route = event.websocket.route || '$connect';
                  if(route === '$default' || route === data.action) {
                    matchedFunction = functionName;
                    break;
                  }
                }
              }
            }
            if(matchedFunction) {
              break;
            }
          }
        }

        if(matchedFunction && config.functions[matchedFunction]) {
          const handler = await loadHandler(config.functions[matchedFunction].handler, outputDir);

          if(handler) {
            // Wrap handler with console log capture
            const wrappedHandler = captureConsoleLogs(handler, quiet);
            const event = {
              requestContext: {
                routeKey: data.action || '$default',
                connectionId: 'test-connection-id',
                apiGateway: {
                  endpoint: `ws://localhost:${wsPort}`
                }
              },
              body: data.body || null
            };

            const context = {
              functionName: matchedFunction,
              functionVersion: '$LATEST',
              invokedFunctionArn: `arn:aws:lambda:us-east-1:123456789012:function:${matchedFunction}`,
              memoryLimitInMB: '128',
              awsRequestId: 'test-request-id',
              logGroupName: `/aws/lambda/${matchedFunction}`,
              logStreamName: 'test-log-stream',
              getRemainingTimeInMillis: () => 30000
            };

            const result = await wrappedHandler(event, context);
            ws.send(JSON.stringify(result));
          } else {
            ws.send(JSON.stringify({error: 'Handler not found'}));
          }
        } else {
          ws.send(JSON.stringify({error: 'WebSocket function not found'}));
        }
      } catch(error) {
        log(`WebSocket error: ${error.message}`, 'error', false);
        ws.send(JSON.stringify({error: error.message}));
      }
    });

    ws.on('close', () => {
      log('WebSocket connection closed', 'info', false);
    });
  });

  return wss;
};

export const serverless = async (cmd: ServerlessOptions, callback: ServerlessCallback = () => ({})): Promise<number> => {
  const {
    cliName = 'Lex',
    config,
    host = 'localhost',
    httpPort = 3000,
    httpsPort = 3001,
    wsPort = 3002,
    quiet = false,
    remove = false,
    usePublicIp,
    variables
  } = cmd;

  const spinner = createSpinner(quiet);

  log(`${cliName} starting serverless development server...`, 'info', quiet);

  await LexConfig.parseConfig(cmd);

  const {outputFullPath} = LexConfig.config;

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

  if(remove) {
    spinner.start('Cleaning output directory...');
    await removeFiles(outputFullPath || '');
    spinner.succeed('Successfully cleaned output directory!');
  }

  // Load serverless configuration
  let serverlessConfig: ServerlessConfig = {};

  try {
    const configPath = config || pathResolve(process.cwd(), 'lex.config.mjs');
    log(`Loading serverless config from: ${configPath}`, 'info', quiet);

    if(existsSync(configPath)) {
      const configModule = await import(configPath);
      serverlessConfig = configModule.default?.serverless || configModule.serverless || {};
      log('Serverless config loaded successfully', 'info', quiet);
    } else {
      log(`No serverless config found at ${configPath}, using defaults`, 'warn', quiet);
    }
  } catch(error) {
    log(`Error loading serverless config: ${error.message}`, 'error', quiet);
    // Don't exit, continue with empty config
  }

  // Merge config with command line options
  const finalConfig: ServerlessConfig = {
    ...serverlessConfig,
    custom: {
      'serverless-offline': {
        httpPort: serverlessConfig.custom?.['serverless-offline']?.httpPort || httpPort,
        httpsPort: serverlessConfig.custom?.['serverless-offline']?.httpsPort || httpsPort,
        wsPort: serverlessConfig.custom?.['serverless-offline']?.wsPort || wsPort,
        host: serverlessConfig.custom?.['serverless-offline']?.host || host,
        cors: serverlessConfig.custom?.['serverless-offline']?.cors !== false
      }
    }
  };

  const outputDir = outputFullPath || 'dist';
  log(`Using output directory: ${outputDir}`, 'info', quiet);

  try {
    spinner.start('Starting serverless development server...');

    const httpPort = finalConfig.custom!['serverless-offline']!.httpPort!;
    const wsPort = finalConfig.custom!['serverless-offline']!.wsPort!;
    const host = finalConfig.custom!['serverless-offline']!.host!;

    log(`Creating HTTP server on ${host}:${httpPort}`, 'info', quiet);
    log(`Creating WebSocket server on port ${wsPort}`, 'info', quiet);

    // Create HTTP server
    const httpServer = createHttpServer(
      finalConfig,
      outputDir,
      httpPort,
      host,
      quiet
    );

    // Create WebSocket server
    const wsServer = createWebSocketServer(
      finalConfig,
      outputDir,
      wsPort,
      quiet
    );

    // Handle server errors
    httpServer.on('error', (error) => {
      log(`HTTP server error: ${error.message}`, 'error', quiet);
      spinner.fail('Failed to start HTTP server.');
      callback(1);
      return;
    });

    wsServer.on('error', (error) => {
      log(`WebSocket server error: ${error.message}`, 'error', quiet);
      spinner.fail('Failed to start WebSocket server.');
      callback(1);
      return;
    });

    // Start servers
    httpServer.listen(httpPort, host, () => {
      spinner.succeed('Serverless development server started.');

      displayServerStatus(
        httpPort,
        finalConfig.custom!['serverless-offline']!.httpsPort!,
        wsPort,
        host,
        quiet
      );

      fetchPublicIp(usePublicIp).then((publicIp) => {
        if(publicIp) {
          displayServerStatus(
            httpPort,
            finalConfig.custom!['serverless-offline']!.httpsPort!,
            wsPort,
            host,
            quiet,
            publicIp
          );
        }
      });
    });

    // Handle graceful shutdown
    const shutdown = () => {
      log('\nShutting down serverless development server...', 'info', quiet);
      httpServer.close();
      wsServer.close();
      callback(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Keep the process alive
    process.stdin.resume();

    log('Serverless development server is running. Press Ctrl+C to stop.', 'info', quiet);

    // Don't call callback here, let the process stay alive
    return 0;
  } catch(error) {
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);
    spinner.fail('Failed to start serverless development server.');
    callback(1);
    return 1;
  }
};