# Serverless Dev Command

The `serverless-dev` command provides a development server similar to serverless-offline, allowing you to test AWS Lambda functions locally with HTTP and WebSocket support.

## Usage

```bash
lex serverless-dev [options]
```

## Options

- `--config <path>` - Custom configuration file path (default: lex.config.mjs)
- `--host <host>` - Host to bind the server to (default: localhost)
- `--httpPort <port>` - HTTP server port (default: 3100)
- `--httpsPort <port>` - HTTPS server port (default: 3101)
- `--wsPort <port>` - WebSocket server port (default: 3102)
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
        httpPort: 3100,
        httpsPort: 3101,
        wsPort: 3102,
        host: 'localhost',
        cors: true
      }
    }
  }
};
```

## Handler Functions

### Explicit HTTP API v2 and local service ports

Functions may opt into a raw HTTP API v2 boundary without changing their existing
`events` declarations. Legacy functions keep the existing v1 event contract.
Declare every local invocation identity explicitly; no account, stage, API or
qualified function version is inferred from the host environment.

```javascript
serverless: {
  local: {
    bootstrap: 'modules/local/bootstrap.createLocalBindings',
    maxConcurrentInvocations: 16
  },
  functions: {
    core: {
      events: [{http: {method: 'GET', path: '/books/{bookId}'}}],
      handler: 'index.coreHandler',
      localInvocation: {
        accountId: '123456789012',
        apiId: 'explicit-local-api',
        functionArn: 'arn:aws:lambda:us-east-1:123456789012:function:core:17',
        payloadVersion: '2.0',
        region: 'us-east-1',
        stage: 'local',
        timeoutMs: 30000
      }
    }
  }
}
```

Routes accept exact paths and one-segment `{parameter}` templates. Exact paths
take precedence. A template may strictly narrow another template with literal
segments, including below shared parent parameters; the most specific matching
route wins independently of declaration order. Incomparable overlapping templates
across different declared function keys are refused, even if their handler strings
or invocation ARNs match. Overlaps within one declared function key are admitted:
Lex selects that function and passes the original event to the app, which retains
its own business route ordering. Normalized duplicate declarations remain refused.
This local dispatch rule does not reorder the application's declaration, produce
business path parameters or emulate its handler dispatch. Raw encoded
paths, repeated query text and body bytes reach the
handler unchanged. Requests carry the configured account/API/stage, the actual
socket source address and a numeric qualified invocation ARN. Returned cookies
become separate `Set-Cookie` headers; base64 bodies become binary bytes.

The optional bootstrap export receives `{invoke}` and returns
`{handlers, close?}`. `handlers` binds declared function names to application
factories with explicitly injected database, storage, authentication and queue
ports. A queue adapter can deliver its original event with
`await invoke('worker', originalEvent)`. Declare `localInvocation` on eventless
worker functions as well, omitting `payloadVersion`. Lex bounds simultaneous
invocations and invokes each request once. It never retries or reconstructs an
application queue message. Invoking during bootstrap is refused; service factories
should retain the port for use after startup. Shutdown refuses new invocations,
drains in-flight invocations and then closes bootstrap resources.

The lean `@nlabs/lex/serverless-local` entry exposes these contracts and the
injected runtime without importing the CLI, Express, filesystem or server startup.
Bootstrap functions must deliberately select realistic services or an explicitly
named synthetic fixture. Lex does not disable application authentication or
change cookie, origin, authorization, paid-operation or recovery policy.

Use an HTTPS frontend proxy when the application requires Secure cookies and an
HTTPS same-origin profile. The existing `httpsPort` display setting does not
create a TLS listener. Environment precedence remains `.env`, `.env.local`,
`.env.development`, then `--variables`, overlaid on the existing process environment.
Opt-in invocation diagnostics omit bodies, cookies, headers and raw application
errors.

When declarations depend on dotenv values, export `serverless` as a factory:
`serverless: (environment) => ({functions, local, custom})`. The command evaluates
it once after the existing dotenv/CLI overlay and passes a frozen environment
snapshot. It also accepts an async factory. Its returned configuration must be
cloneable data; invalid results or factory exceptions stop startup with sanitized
diagnostics. Object configurations keep their existing evaluation order. Avoid
reading environment-dependent descriptors at module scope: initial Lex config
loading occurs before the command's dotenv overlay.

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
const event = {
  httpMethod: 'GET',
  path: '/hello',
  headers: {},
  queryStringParameters: {},
  body: null
};
```

### WebSocket Events

```javascript
const event = {
  requestContext: {
    routeKey: '$default',
    connectionId: 'test-connection-id',
    apiGateway: {
      endpoint: 'ws://localhost:3102'
    }
  },
  body: 'message content'
};
```

## Context Object

Both HTTP and WebSocket handlers receive a context object that simulates AWS Lambda context:

```javascript
const context = {
  functionName: 'function-name',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:function-name',
  memoryLimitInMB: '128',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/function-name',
  logStreamName: 'test-log-stream',
  getRemainingTimeInMillis: () => 30000
};
```

## Examples

### Basic HTTP Function

```bash
# Start serverless server
lex serverless-dev

# Test the function
curl http://localhost:3100/hello
```

### Custom Ports

```bash
# Start with custom ports
lex serverless-dev --httpPort 4000 --wsPort 4002
```

### With Environment Variables

The `serverless-dev` command automatically loads environment variables from `.env` files in the following order (later files override earlier ones):
- `.env`
- `.env.local`
- `.env.development`

```bash
# Start with automatic .env file loading
lex serverless-dev

# Override with command line variables (takes precedence over .env files)
lex serverless-dev --variables '{"NODE_ENV":"development","API_KEY":"test"}'
```

### With Custom Config

```bash
# Use custom configuration file
lex serverless-dev --config ./custom-serverless.config.mjs
```

### With GraphQL Debug Logging

```bash
# Enable GraphQL debug logging (similar to serverless npm module)
lex serverless-dev --debug --printOutput

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
