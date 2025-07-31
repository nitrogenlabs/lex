# Serverless Example

This example demonstrates how to use the `lex serverless` command to run AWS Lambda functions locally with HTTP and WebSocket support.

## Setup

1. Navigate to this directory:

```bash
cd examples/serverless-example
```

2. Start the serverless development server:

```bash
lex serverless
```

## Available Endpoints

### HTTP Endpoints

- **GET /hello** - Returns a hello message with request details
- **POST /echo** - Echoes back the request body

### WebSocket Endpoint

- **ws://localhost:3002** - WebSocket server for real-time communication

## Testing the Endpoints

### HTTP Testing

```bash
# Test GET endpoint
curl http://localhost:3000/hello

# Test POST endpoint
curl -X POST http://localhost:3000/echo \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from curl!"}'
```

### WebSocket Testing

You can use a WebSocket client or browser console:

```javascript
// In browser console
const ws = new WebSocket('ws://localhost:3002');
ws.onopen = () => {
  console.log('Connected to WebSocket');
  ws.send(JSON.stringify({
    action: '$default',
    body: 'Hello from WebSocket!'
  }));
};
ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};
```

## Configuration

The serverless configuration is defined in `lex.config.mjs`:

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
      }
    },
    custom: {
      'serverless-offline': {
        httpPort: 3000,
        wsPort: 3002,
        host: 'localhost'
      }
    }
  }
};
```

## Handler Functions

Handler functions receive AWS Lambda-style event and context objects:

- **event**: Contains request data (HTTP method, path, headers, body, etc.)
- **context**: Contains Lambda context information (function name, request ID, etc.)

## Features

- **HTTP Server**: Routes HTTP requests to appropriate Lambda functions
- **WebSocket Server**: Handles WebSocket connections and messages
- **CORS Support**: Automatic CORS headers for cross-origin requests
- **Dynamic Loading**: Loads handlers from the output directory
- **AWS Lambda Simulation**: Provides event and context objects similar to AWS Lambda
