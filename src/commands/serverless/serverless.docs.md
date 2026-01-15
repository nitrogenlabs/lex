# Serverless Command

The `serverless` command provides a development server similar to serverless-offline, allowing you to test AWS Lambda functions locally with HTTP and WebSocket support.

## Usage

```bash
lex serverless [options]
```

## Options

- `--config <path>` - Custom configuration file path (default: lex.config.mjs)
- `--host <host>` - Host to bind the server to (default: localhost)
- `--httpPort <port>` - HTTP server port (default: 3000)
- `--httpsPort <port>` - HTTPS server port (default: 3001)
- `--wsPort <port>` - WebSocket server port (default: 3002)
- `--quiet` - No Lex notifications printed in the console
- `--remove` - Removes all files from the output directory before starting
- `--usePublicIp` - Force refresh the cached public IP address
- `--variables <json>` - Environment variables to set in process.env (overrides .env file variables)
- `--debug` - Enable GraphQL debug logging to see queries, variables, and operations
- `--printOutput` - Print GraphQL response output including status, headers, and body

## Configuration

The serverless configuration should be defined in your `lex.config.mjs` file:

```javascript
export default {
  outputFullPath: './lib',
  serverless: {
    functions: {
      hello: {
        handler: 'handlers/hello.js',
        events: [
          {
            http: {
              path: '/hello',
              method: 'GET',
              cors: true
            }
          }
        ]
      },
      websocket: {
        handler: 'handlers/websocket.js',
        events: [
          {
            websocket: {
              route: '$default'
            }
          }
        ]
      }
    },
    custom: {
      'serverless-offline': {
        httpPort: 3000,
        httpsPort: 3001,
        wsPort: 3002,
        host: 'localhost',
        cors: true
      }
    }
  }
};
```

## Handler Functions

### HTTP Handlers

HTTP handlers should export a function that receives an event and context object:

```javascript
// handlers/hello.js
export const handler = async (event, context) => ({
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Hello from serverless!',
    path: event.path,
    method: event.httpMethod
  })
});
```

### WebSocket Handlers

WebSocket handlers should export a function that receives an event and context object:

```javascript
// handlers/websocket.js
export const handler = async (event, context) => {
  const {routeKey, connectionId} = event.requestContext;

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'WebSocket message received',
      route: routeKey,
      connectionId
    })
  };
};
```

## Event Object Structure

### HTTP Events

```javascript
{
  httpMethod: 'GET',
  path: '/hello',
  headers: {},
  queryStringParameters: {},
  body: null
}
```

### WebSocket Events

```javascript
{
  requestContext: {
    routeKey: '$default',
    connectionId: 'test-connection-id',
    apiGateway: {
      endpoint: 'ws://localhost:3002'
    }
  },
  body: 'message content'
}
```

## Context Object

Both HTTP and WebSocket handlers receive a context object that simulates AWS Lambda context:

```javascript
{
  functionName: 'function-name',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:function-name',
  memoryLimitInMB: '128',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/function-name',
  logStreamName: 'test-log-stream',
  getRemainingTimeInMillis: () => 30000
}
```

## Examples

### Basic HTTP Function

```bash
# Start serverless server
lex serverless

# Test the function
curl http://localhost:3000/hello
```

### Custom Ports

```bash
# Start with custom ports
lex serverless --httpPort 4000 --wsPort 4002
```

### With Environment Variables

The serverless command automatically loads environment variables from `.env` files in the following order (later files override earlier ones):
- `.env`
- `.env.local`
- `.env.development`

```bash
# Start with automatic .env file loading
lex serverless

# Override with command line variables (takes precedence over .env files)
lex serverless --variables '{"NODE_ENV":"development","API_KEY":"test"}'
```

### With Custom Config

```bash
# Use custom configuration file
lex serverless --config ./custom-serverless.config.mjs
```

### With GraphQL Debug Logging

```bash
# Enable GraphQL debug logging (similar to serverless npm module)
lex serverless --debug --printOutput

# Debug mode shows:
# - GraphQL queries and operations
# - Variables and operation names
# - Response status, headers, and body
```

## Features

- **HTTP Server**: Serves HTTP requests and routes them to appropriate Lambda functions
- **WebSocket Server**: Handles WebSocket connections and messages
- **CORS Support**: Automatic CORS headers for HTTP requests
- **Dynamic Handler Loading**: Loads handlers from the output directory
- **AWS Lambda Simulation**: Provides event and context objects similar to AWS Lambda
- **Graceful Shutdown**: Handles SIGINT and SIGTERM signals properly
- **Public IP Detection**: Shows public IP address for external access
- **Configuration Merging**: Merges command line options with configuration file settings
- **GraphQL Debug Mode**: Detailed logging of GraphQL queries, variables, operations, and responses (similar to serverless npm module)
