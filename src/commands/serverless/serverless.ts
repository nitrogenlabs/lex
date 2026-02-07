/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {readFileSync, existsSync, mkdirSync, writeFileSync} from 'fs';
import {homedir} from 'os';
import {resolve as pathResolve, join, isAbsolute} from 'path';
import {pathToFileURL} from 'url';
import boxen from 'boxen';
import chalk from 'chalk';
import express from 'express';
import {WebSocketServer} from 'ws';
import {LexConfig, getPackageDir} from '../../LexConfig.js';
import {createSpinner, removeFiles} from '../../utils/app.js';
import {log} from '../../utils/log.js';

export interface ServerlessOptions {
  readonly cliName?: string;
  readonly config?: string;
  readonly debug?: boolean;
  readonly host?: string;
  readonly httpPort?: number;
  readonly httpsPort?: number;
  readonly quiet?: boolean;
  readonly remove?: boolean;
  readonly test?: boolean;
  readonly usePublicIp?: boolean;
  readonly variables?: string;
  readonly wsPort?: number;
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
      readonly cors?: boolean;
      readonly method?: string;
      readonly path?: string;
    };
    readonly websocket?: {
      readonly route?: string;
    };
  }>;
}

interface ServerlessConfig {
  readonly custom?: {
    readonly 'serverless-offline'?: {
      readonly cors?: boolean;
      readonly host?: string;
      readonly httpPort?: number;
      readonly httpsPort?: number;
      readonly wsPort?: number;
    };
  };
  readonly functions?: Record<string, ServerlessHandler>;
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
      backgroundColor: '#1a1a1a',
      borderColor: 'cyan',
      borderStyle: 'round',
      margin: 1,
      padding: 1
    }
  );

  console.log(`\n${statusBox}\n`);
};

const loadHandler = async (handlerPath: string, outputDir: string) => {
  try {
    console.log(`[Serverless] Parsing handler path: ${handlerPath}`);

    // Parse AWS Lambda handler format: "path/to/file.exportName" or "file.exportName"
    // Examples: "index.handler", "handlers/api.handler", "src/index.default"
    const handlerParts = handlerPath.split('.');
    console.log('[Serverless] Handler parts after split:', handlerParts);

    let filePath: string;
    let exportName: string | null = null;

    if(handlerParts.length > 1) {
      // AWS Lambda format: "file.exportName"
      // Take the last part as export name, rest as file path
      // Handle cases like "index.handler" -> file: "index", export: "handler"
      // Or "handlers/api.handler" -> file: "handlers/api", export: "handler"
      exportName = handlerParts[handlerParts.length - 1] || null;
      filePath = handlerParts.slice(0, -1).join('.');
      console.log(`[Serverless] Parsed AWS Lambda format - filePath: "${filePath}", exportName: "${exportName}"`);
    } else {
      // Simple format: just the file path
      filePath = handlerPath;
      console.log(`[Serverless] Simple format - filePath: "${filePath}"`);
    }

    // Ensure filePath doesn't have the export name in it
    if(filePath.includes('.handler') || filePath.includes('.default')) {
      console.error(`[Serverless] WARNING: filePath still contains export name! filePath: "${filePath}"`);
      // Try to fix it - remove the last part if it looks like an export name
      const pathParts = filePath.split('.');
      if(pathParts.length > 1) {
        const lastPart = pathParts[pathParts.length - 1];
        if(['handler', 'default', 'index'].includes(lastPart) && !exportName) {
          exportName = lastPart;
          filePath = pathParts.slice(0, -1).join('.');
          console.log(`[Serverless] Fixed - filePath: "${filePath}", exportName: "${exportName}"`);
        }
      }
    }

    // Handle both relative paths and absolute paths
    let fullPath: string;
    if(isAbsolute(filePath)) {
      fullPath = filePath;
    } else {
      fullPath = pathResolve(outputDir, filePath);
    }
    console.log(`[Serverless] Resolved fullPath (before extensions): ${fullPath}`);

    // Try different extensions if file doesn't exist
    if(!existsSync(fullPath)) {
      const extensions = ['.js', '.mjs', '.cjs'];
      const pathWithoutExt = fullPath.replace(/\.(js|mjs|cjs)$/, '');
      console.log(`[Serverless] Trying extensions. Base path: ${pathWithoutExt}`);
      for(const ext of extensions) {
        const candidatePath = pathWithoutExt + ext;
        console.log(`[Serverless] Checking: ${candidatePath} (exists: ${existsSync(candidatePath)})`);
        if(existsSync(candidatePath)) {
          fullPath = candidatePath;
          console.log(`[Serverless] Found file with extension: ${fullPath}`);
          break;
        }
      }
    } else {
      console.log(`[Serverless] File exists without trying extensions: ${fullPath}`);
    }

    console.log(`[Serverless] Final fullPath: ${fullPath}`);
    console.log(`[Serverless] Export name: ${exportName || 'default/handler'}`);
    console.log(`[Serverless] File exists: ${existsSync(fullPath)}`);

    if(!existsSync(fullPath)) {
      console.error(`[Serverless] Handler file not found: ${fullPath}`);
      console.error(`[Serverless] Output directory: ${outputDir}`);
      console.error(`[Serverless] Handler path from config: ${handlerPath}`);
      throw new Error(`Handler file not found: ${fullPath}`);
    }

    // Dynamic import of the handler with better error handling
    // Add .js extension if importing TypeScript compiled output
    const importPath = fullPath.endsWith('.ts') ? fullPath.replace(/\.ts$/, '.js') : fullPath;

    try {
      // Convert to file:// URL for ES module imports (required for absolute paths)
      // Use pathToFileURL to ensure proper file:// URL format
      const importUrl = pathToFileURL(importPath).href;
      console.log(`[Serverless] Importing handler from: ${importUrl}`);
      console.log(`[Serverless] File path: ${importPath}`);

      // Use import() with the file URL
      // Note: If the handler file has import errors (like missing dependencies),
      // those will surface here, but that's a handler code issue, not a loader issue
      const handlerModule = await import(importUrl);
      console.log(`[Serverless] Handler module loaded successfully. Exports: ${Object.keys(handlerModule).join(', ')}`);

      // Get the handler based on export name or try defaults
      let handler: any;
      if(exportName) {
        handler = handlerModule[exportName];
        if(!handler) {
          console.error(`[Serverless] Export "${exportName}" not found in module. Available exports: ${Object.keys(handlerModule).join(', ')}`);
          return null;
        }
      } else {
        // Try default, handler, or the module itself
        handler = handlerModule.default || handlerModule.handler || handlerModule;
      }

      console.log(`[Serverless] Handler found: ${typeof handler}, isFunction: ${typeof handler === 'function'}`);

      if(typeof handler !== 'function') {
        console.error(`[Serverless] Handler is not a function. Type: ${typeof handler}, Value:`, handler);
        return null;
      }

      return handler;
    } catch(importError: any) {
      console.error(`[Serverless] Import error for handler ${handlerPath}:`, importError.message);
      console.error('[Serverless] Import error stack:', importError.stack);

      // Check if this is a dependency resolution error (common with ES modules)
      if(importError.message && importError.message.includes('Cannot find module')) {
        console.error('[Serverless] This appears to be a dependency resolution error.');
        console.error('[Serverless] The handler file exists, but one of its imports is failing.');
        console.error('[Serverless] Check that all dependencies in the handler file are properly installed.');
        console.error(`[Serverless] Handler file: ${importPath}`);
        console.error('[Serverless] Make sure the handler and its dependencies are compiled correctly.');
      }

      return null;
    }
  } catch(error: any) {
    console.error(`[Serverless] Error loading handler ${handlerPath}:`, error.message);
    console.error('[Serverless] Error stack:', error.stack);
    return null;
  }
};

const captureConsoleLogs = (handler: (event: any, context: any) => Promise<any>, quiet: boolean) => {
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

const createExpressServer = async (
  config: ServerlessConfig,
  outputDir: string,
  httpPort: number,
  host: string,
  quiet: boolean,
  debug: boolean
) => {
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
    } catch(error) {
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
          awsRequestId: 'test-request-id',
          functionName: 'graphql',
          functionVersion: '$LATEST',
          getRemainingTimeInMillis: () => 30000,
          invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:graphql',
          logGroupName: '/aws/lambda/graphql',
          logStreamName: 'test-log-stream',
          req,
          res
        };

        // Wrap handler with console log capture
        const wrappedHandler = captureConsoleLogs(graphqlHandler, quiet);

        try {
          // Call the handler with GraphQL parameters
          const result = await wrappedHandler({
            body: JSON.stringify(req.body),
            headers: req.headers,
            httpMethod: 'POST',
            path: graphqlPath,
            queryStringParameters: {}
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
        } catch(error) {
          // Restore console.log
          console.log = originalConsoleLog;
          log(`GraphQL handler error: ${error.message}`, 'error', false);
          res.status(500).json({error: error.message});
        }
      });

      log(`GraphQL endpoint available at http://${host}:${httpPort}${graphqlPath}`, 'info', quiet);
    }
  } catch(error) {
    log(`Error setting up GraphQL: ${error.message}`, 'error', quiet);
  }

  // Fallback for non-GraphQL routes - handle all remaining routes
  app.use('/', async (req, res) => {
    try {
      const url = req.url || '/';
      const method = req.method || 'GET';
      const pathname = req.path || url.split('?')[0]; // Extract pathname without query string

      // Always log requests (not affected by quiet flag for debugging)
      console.log(`[Serverless] ${method} ${url} (pathname: ${pathname})`);

      // Find matching function
      let matchedFunction = null;

      if(config.functions) {
        const functionNames = Object.keys(config.functions);
        console.log(`[Serverless] Available functions: ${functionNames.join(', ')}`);
        console.log('[Serverless] Config functions:', JSON.stringify(config.functions, null, 2));

        for(const [functionName, functionConfig] of Object.entries(config.functions)) {
          if(functionConfig.events) {
            for(const event of functionConfig.events) {
              if(event.http) {
                const eventPath = event.http.path || '/';
                const eventMethod = (event.http.method || 'GET').toUpperCase();
                const requestMethod = method.toUpperCase();

                console.log(`[Serverless] Checking function ${functionName}: path="${eventPath}", method="${eventMethod}" against pathname="${pathname}", method="${requestMethod}"`);

                // Improved path matching - compare pathname without query string
                // Normalize paths (remove trailing slashes for comparison)
                const normalizedEventPath = eventPath.replace(/\/$/, '') || '/';
                const normalizedPathname = pathname.replace(/\/$/, '') || '/';

                if(normalizedEventPath === normalizedPathname && eventMethod === requestMethod) {
                  matchedFunction = functionName;
                  console.log(`[Serverless] ✓ Matched function: ${matchedFunction}`);
                  break;
                }
              }
            }
          }
          if(matchedFunction) {
            break;
          }
        }
      } else {
        console.log('[Serverless] No functions found in config');
      }

      if(matchedFunction && config.functions[matchedFunction]) {
        // Resolve handler path relative to output directory
        const handlerPath = config.functions[matchedFunction].handler;
        console.log(`[Serverless] Loading handler: ${handlerPath} from outputDir: ${outputDir}`);
        const handler = await loadHandler(handlerPath, outputDir);

        if(handler) {
          console.log(`[Serverless] Handler loaded successfully, type: ${typeof handler}`);
          const wrappedHandler = captureConsoleLogs(handler, quiet);

          const event = {
            body: req.body,
            headers: req.headers,
            httpMethod: method,
            path: url,
            queryStringParameters: req.query
          };

          const context = {
            awsRequestId: 'test-request-id',
            functionName: matchedFunction,
            functionVersion: '$LATEST',
            getRemainingTimeInMillis: () => 30000,
            invokedFunctionArn: `arn:aws:lambda:us-east-1:123456789012:function:${matchedFunction}`,
            logGroupName: `/aws/lambda/${matchedFunction}`,
            logStreamName: 'test-log-stream',
            memoryLimitInMB: '128'
          };

          try {
            console.log('[Serverless] Calling handler with event:', JSON.stringify(event, null, 2));
            const result = await wrappedHandler(event, context);
            console.log('[Serverless] Handler returned:', JSON.stringify(result, null, 2));

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
          } catch(error: any) {
            console.error('[Serverless] Handler error:', error.message);
            console.error('[Serverless] Handler error stack:', error.stack);
            log(`Handler error: ${error.message}`, 'error', false);
            res.status(500).json({error: error.message});
          }
        } else {
          console.error(`[Serverless] Handler not found for function: ${matchedFunction}`);
          console.error(`[Serverless] Handler path: ${handlerPath}, Output dir: ${outputDir}`);
          res.status(404).json({error: 'Handler not found'});
        }
      } else {
        console.error(`[Serverless] Function not found for pathname: ${pathname}, method: ${method}`);
        console.error(`[Serverless] Available functions: ${config.functions ? Object.keys(config.functions).join(', ') : 'none'}`);
        res.status(404).json({error: 'Function not found'});
      }
    } catch(error) {
      log(`Route handling error: ${error.message}`, 'error', false);
      res.status(500).json({error: error.message});
    }
  });

  return app;
};

const createWebSocketServer = (
  config: ServerlessConfig,
  outputDir: string,
  wsPort: number,
  quiet: boolean,
  debug: boolean
) => {
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
              body: data.body || null,
              requestContext: {
                apiGateway: {
                  endpoint: `ws://localhost:${wsPort}`
                },
                connectionId: 'test-connection-id',
                routeKey: data.action || '$default'
              }
            };

            const context = {
              awsRequestId: 'test-request-id',
              functionName: matchedFunction,
              functionVersion: '$LATEST',
              getRemainingTimeInMillis: () => 30000,
              invokedFunctionArn: `arn:aws:lambda:us-east-1:123456789012:function:${matchedFunction}`,
              logGroupName: `/aws/lambda/${matchedFunction}`,
              logStreamName: 'test-log-stream',
              memoryLimitInMB: '128'
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
  } catch(error) {
    log(`Warning: Could not load .env file at ${envPath}: ${error.message}`, 'warn', false);
  }

  return envVars;
};

export const serverless = async (
  cmd: ServerlessOptions,
  callback: ServerlessCallback = () => ({})
): Promise<number> => {
  const {
    cliName = 'Lex',
    config,
    debug = false,
    host: cliHost,
    httpPort: cliHttpPort,
    httpsPort: cliHttpsPort,
    quiet = false,
    remove = false,
    test = false,
    usePublicIp,
    variables,
    wsPort: cliWsPort
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
    } catch(_error) {
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
    // Use getPackageDir to handle npm workspaces correctly
    const packageDir = getPackageDir();

    // Try multiple config file formats
    const configFormats = config ? [config] : [
      pathResolve(packageDir, 'lex.config.mjs'),
      pathResolve(packageDir, 'lex.config.js'),
      pathResolve(packageDir, 'lex.config.cjs'),
      pathResolve(packageDir, 'lex.config.ts')
    ];

    let configPath: string | null = null;
    for(const candidatePath of configFormats) {
      if(existsSync(candidatePath)) {
        configPath = candidatePath;
        break;
      }
    }

    if(configPath) {
      log(`Loading serverless config from: ${configPath}`, 'info', quiet);
      const configModule = await import(configPath);
      serverlessConfig = configModule.default?.serverless || configModule.serverless || {};
      log('Serverless config loaded successfully', 'info', quiet);
      const functionNames = Object.keys(serverlessConfig.functions || {});
      log(`Loaded functions: ${functionNames.length > 0 ? functionNames.join(', ') : 'none'}`, 'info', quiet);

      // Debug: Print full config if debug mode
      if(debug) {
        log(`Full serverless config: ${JSON.stringify(serverlessConfig, null, 2)}`, 'info', false);
      }
    } else {
      log(`No serverless config found. Tried: ${configFormats.join(', ')}`, 'warn', quiet);
    }
  } catch(error) {
    log(`Error loading serverless config: ${error.message}`, 'error', quiet);
    if(debug) {
      log(`Config error stack: ${error.stack}`, 'error', false);
    }
    // Don't exit, continue with empty config
  }

  // Merge config with command line options
  // Determine effective host/ports with correct precedence: CLI > config > defaults
  const configOffline = serverlessConfig.custom?.['serverless-offline'] || {};
  const effectiveHost = (cliHost ?? configOffline.host ?? 'localhost') as string;
  const toNumber = (v: any, fallback: number): number => {
    if(v === undefined || v === null || v === '') {
      return fallback;
    }

    const n = typeof v === 'number' ? v : parseInt(String(v));
    return Number.isFinite(n) ? n : fallback;
  };
  const effectiveHttpPort = toNumber(cliHttpPort ?? configOffline.httpPort, 5000);
  const effectiveHttpsPort = toNumber(cliHttpsPort ?? configOffline.httpsPort, 5001);
  const effectiveWsPort = toNumber(cliWsPort ?? configOffline.wsPort, 5002);

  const finalConfig: ServerlessConfig = {
    ...serverlessConfig,
    custom: {
      'serverless-offline': {
        cors: serverlessConfig.custom?.['serverless-offline']?.cors !== false,
        host: effectiveHost,
        httpPort: effectiveHttpPort,
        httpsPort: effectiveHttpsPort,
        wsPort: effectiveWsPort
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
      debug
    );

    // Create WebSocket server
    const wsServer = createWebSocketServer(
      finalConfig,
      outputDir,
      wsPort,
      quiet,
      debug
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
  } catch(error) {
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);
    spinner.fail('Failed to start serverless development server.');
    callback(1);
    return 1;
  }
};