/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import boxen from 'boxen';
import chalk from 'chalk';
import express from 'express';
import {readFileSync, existsSync, mkdirSync, writeFileSync} from 'fs';
import {networkInterfaces, homedir} from 'os';
import {resolve as pathResolve, join} from 'path';
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
  readonly debug?: boolean;
  readonly printOutput?: boolean;
  readonly test?: boolean;
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

  // Use fetch instead of https
  fetch('https://api.ipify.org')
    .then((res) => res.text())
    .then((data) => {
      const ip = data.trim();
      if(ip) {
        writePublicIpCache(ip);
      }
      resolve(ip);
    })
    .catch(() => resolve(undefined));
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

const displayServerStatus = (
  httpPort: number,
  httpsPort: number,
  wsPort: number,
  host: string,
  quiet: boolean,
  publicIp?: string
) => {
  if(quiet) {
    return;
  }

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

    // Dynamic import of the handler with better error handling
    try {
      const handlerModule = await import(fullPath);
      log(`Handler module loaded: ${Object.keys(handlerModule)}`, 'info', false);

      const handler = handlerModule.default || handlerModule.handler || handlerModule;
      log(`Handler found: ${typeof handler}`, 'info', false);

      return handler;
    } catch (importError) {
      log(`Import error for handler ${handlerPath}: ${importError.message}`, 'error', false);
      return null;
    }
  } catch (error) {
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

const createExpressServer = async (config: ServerlessConfig, outputDir: string, httpPort: number, host: string, quiet: boolean, debug: boolean, printOutput: boolean) => {
  const app = express();

  // Enable CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Credentials', 'true');

    if(req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Parse JSON bodies
  app.use(express.json());

  // Load GraphQL handler
  const loadGraphQLSchema = async () => {
    try {
      // Try to find a GraphQL handler
      let graphqlHandler = null;

      if(config.functions) {
        for(const [functionName, functionConfig] of Object.entries(config.functions)) {
          if(functionConfig.events) {
            for(const event of functionConfig.events) {
              if(event.http && event.http.path) {
                // Look for GraphQL endpoints
                if(event.http.path === '/public' || event.http.path === '/graphql') {
                  graphqlHandler = await loadHandler(functionConfig.handler, outputDir);
                  break;
                }
              }
            }
          }
          if(graphqlHandler) {
            break;
          }
        }
      }

      if(graphqlHandler) {
        log('Found GraphQL handler', 'info', quiet);
        return graphqlHandler;
      }
      return null;
    } catch (error) {
      log(`Error loading GraphQL handler: ${error.message}`, 'error', quiet);
      return null;
    }
  };

  // Set up GraphQL handler for GraphQL requests
  try {
    const graphqlHandler = await loadGraphQLSchema();
    if(graphqlHandler) {
      // Find the GraphQL path from the serverless config
      let graphqlPath = '/graphql'; // default fallback

      if(config.functions) {
        for(const [_functionName, functionConfig] of Object.entries(config.functions)) {
          if(functionConfig.events) {
            for(const event of functionConfig.events) {
              if(event?.http?.path) {
                graphqlPath = event.http.path;
                break;
              }
            }
          }
          if(graphqlPath !== '/graphql') {
            break;
          }
        }
      }

      // Set up GraphQL endpoint with enhanced console.log capture
      app.use(graphqlPath, async (req, res) => {
        // GraphQL Debug Logging
        if(debug && req.body && req.body.query) {
          log('🔍 GraphQL Debug Mode: Analyzing request...', 'info', false);
          log(`📝 GraphQL Query: ${req.body.query}`, 'info', false);
          if(req.body.variables) {
            log(`📊 GraphQL Variables: ${JSON.stringify(req.body.variables, null, 2)}`, 'info', false);
          }
          if(req.body.operationName) {
            log(`🏷️  GraphQL Operation: ${req.body.operationName}`, 'info', false);
          }
        }

        // Enhanced console.log capture
        const originalConsoleLog = console.log;
        const logs: string[] = [];

        console.log = (...args) => {
          const logMessage = args.map((arg) =>
            (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg))
          ).join(' ');
          logs.push(logMessage);
          originalConsoleLog(`[GraphQL] ${logMessage}`);
        };

        // Create context for the handler
        const context = {
          req,
          res,
          functionName: 'graphql',
          functionVersion: '$LATEST',
          invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:graphql',
          memoryLimitInMB: '128',
          awsRequestId: 'test-request-id',
          logGroupName: '/aws/lambda/graphql',
          logStreamName: 'test-log-stream',
          getRemainingTimeInMillis: () => 30000
        };

        // Wrap handler with console log capture
        const wrappedHandler = captureConsoleLogs(graphqlHandler, quiet);

        try {
          // Call the handler with GraphQL parameters
          const result = await wrappedHandler({
            httpMethod: 'POST',
            path: graphqlPath,
            headers: req.headers,
            queryStringParameters: {},
            body: JSON.stringify(req.body)
          }, context);

          // Restore console.log
          console.log = originalConsoleLog;

          // Handle the result
          if(result && typeof result === 'object' && result.statusCode) {
            res.status(result.statusCode);
            if(result.headers) {
              Object.entries(result.headers).forEach(([key, value]) => {
                res.setHeader(key, String(value));
              });
            }
            res.send(result.body);
          } else {
            res.json(result);
          }
        } catch (error) {
          // Restore console.log
          console.log = originalConsoleLog;
          log(`GraphQL handler error: ${error.message}`, 'error', false);
          res.status(500).json({error: error.message});
        }
      });

      log(`GraphQL endpoint available at http://${host}:${httpPort}${graphqlPath}`, 'info', quiet);
    }
  } catch (error) {
    log(`Error setting up GraphQL: ${error.message}`, 'error', quiet);
  }

  // Fallback for non-GraphQL routes - handle all remaining routes
  app.use('/', async (req, res) => {
    try {
      const url = req.url || '/';
      const method = req.method || 'GET';

      log(`${method} ${url}`, 'info', false);

      // Find matching function
      let matchedFunction = null;

      if(config.functions) {
        for(const [functionName, functionConfig] of Object.entries(config.functions)) {
          if(functionConfig.events) {
            for(const event of functionConfig.events) {
              if(event.http) {
                const eventPath = event.http.path || '/';
                const eventMethod = event.http.method || 'GET';

                // Simple path matching - avoid complex regex
                if(eventPath && eventPath === url && eventMethod === method) {
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
        // Resolve handler path relative to output directory
        const handlerPath = config.functions[matchedFunction].handler;
        const handler = await loadHandler(handlerPath, outputDir);

        if(handler) {
          const wrappedHandler = captureConsoleLogs(handler, quiet);

          const event = {
            body: req.body,
            headers: req.headers,
            httpMethod: method,
            path: url,
            queryStringParameters: req.query
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

          try {
            const result = await wrappedHandler(event, context);

            if(result && typeof result === 'object' && result.statusCode) {
              res.status(result.statusCode);
              if(result.headers) {
                Object.entries(result.headers).forEach(([key, value]) => {
                  res.setHeader(key, String(value));
                });
              }
              res.send(result.body);
            } else {
              res.json(result);
            }
          } catch (error) {
            log(`Handler error: ${error.message}`, 'error', false);
            res.status(500).json({error: error.message});
          }
        } else {
          res.status(404).json({error: 'Handler not found'});
        }
      } else {
        res.status(404).json({error: 'Function not found'});
      }
    } catch (error) {
      log(`Route handling error: ${error.message}`, 'error', false);
      res.status(500).json({error: error.message});
    }
  });

  return app;
};

const createWebSocketServer = (config: ServerlessConfig, outputDir: string, wsPort: number, quiet: boolean, debug: boolean, printOutput: boolean) => {
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

            // Handle Lambda response format for WebSocket
            if(result && typeof result === 'object' && result.statusCode) {
              // This is a Lambda response object, extract the body
              const body = result.body || '';
              ws.send(body);
            } else {
              // This is a direct response, stringify it
              ws.send(JSON.stringify(result));
            }
          } else {
            ws.send(JSON.stringify({error: 'Handler not found'}));
          }
        } else {
          ws.send(JSON.stringify({error: 'WebSocket function not found'}));
        }
      } catch (error) {
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

const loadEnvFile = (envPath: string): Record<string, string> => {
  const envVars: Record<string, string> = {};

  if(!existsSync(envPath)) {
    return envVars;
  }

  try {
    const envContent = readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    for(const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty lines and comments
      if(!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      // Parse KEY=value format
      const equalIndex = trimmedLine.indexOf('=');
      if(equalIndex > 0) {
        const key = trimmedLine.substring(0, equalIndex).trim();
        const value = trimmedLine.substring(equalIndex + 1).trim();

        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '');

        if(key) {
          envVars[key] = cleanValue;
        }
      }
    }
  } catch (error) {
    log(`Warning: Could not load .env file at ${envPath}: ${error.message}`, 'warn', false);
  }

  return envVars;
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
    variables,
    debug = false,
    printOutput = false,
    test = false
  } = cmd;

  const spinner = createSpinner(quiet);

  log(`${cliName} starting serverless development server...`, 'info', quiet);

  await LexConfig.parseConfig(cmd);

  const {outputFullPath} = LexConfig.config;

  // Load environment variables from .env files
  const envPaths = [
    pathResolve(process.cwd(), '.env'),
    pathResolve(process.cwd(), '.env.local'),
    pathResolve(process.cwd(), '.env.development')
  ];

  let envVars: Record<string, string> = {};

  // Load from .env files in order (later files override earlier ones)
  for(const envPath of envPaths) {
    const fileEnvVars = loadEnvFile(envPath);
    if(Object.keys(fileEnvVars).length > 0) {
      log(`Loaded environment variables from: ${envPath}`, 'info', quiet);
    }
    envVars = {...envVars, ...fileEnvVars};
  }

  // Start with default NODE_ENV and loaded .env variables
  let variablesObj: object = {NODE_ENV: 'development', ...envVars};

  // Override with command line variables if provided
  if(variables) {
    try {
      const cliVars = JSON.parse(variables);
      variablesObj = {...variablesObj, ...cliVars};
    } catch (_error) {
      log(`\n${cliName} Error: Environment variables option is not a valid JSON object.`, 'error', quiet);
      callback(1);
      return 1;
    }
  }

  process.env = {...process.env, ...variablesObj};

  // If in test mode, exit early after loading environment variables
  if(test) {
    log('Test mode: Environment variables loaded, exiting', 'info', quiet);
    callback(0);
    return 0;
  }

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
      log(`Loaded functions: ${Object.keys(serverlessConfig.functions || {}).join(', ')}`, 'info', quiet);
    } else {
      log(`No serverless config found at ${configPath}, using defaults`, 'warn', quiet);
    }
  } catch (error) {
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

  const outputDir = outputFullPath || 'lib';
  log(`Using output directory: ${outputDir}`, 'info', quiet);

  try {
    spinner.start('Starting serverless development server...');

    const httpPort = finalConfig.custom!['serverless-offline']!.httpPort!;
    const wsPort = finalConfig.custom!['serverless-offline']!.wsPort!;
    const host = finalConfig.custom!['serverless-offline']!.host!;

    log(`Creating HTTP server on ${host}:${httpPort}`, 'info', quiet);
    log(`Creating WebSocket server on port ${wsPort}`, 'info', quiet);

    // Create Express server
    const expressApp = await createExpressServer(
      finalConfig,
      outputDir,
      httpPort,
      host,
      quiet,
      debug,
      printOutput
    );

    // Create WebSocket server
    const wsServer = createWebSocketServer(
      finalConfig,
      outputDir,
      wsPort,
      quiet,
      debug,
      printOutput
    );

    // Handle server errors
    wsServer.on('error', (error) => {
      log(`WebSocket server error: ${error.message}`, 'error', quiet);
      spinner.fail('Failed to start WebSocket server.');
      callback(1);
      return;
    });

    // Start Express server
    const server = expressApp.listen(httpPort, host, () => {
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

    // Handle Express server errors
    server.on('error', (error) => {
      log(`Express server error: ${error.message}`, 'error', quiet);
      spinner.fail('Failed to start Express server.');
      callback(1);
      return;
    });

    // Handle graceful shutdown
    const shutdown = () => {
      log('\nShutting down serverless development server...', 'info', quiet);
      server.close();
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
  } catch (error) {
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);
    spinner.fail('Failed to start serverless development server.');
    callback(1);
    return 1;
  }
};