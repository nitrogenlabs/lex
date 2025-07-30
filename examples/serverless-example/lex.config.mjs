export default {
  outputFullPath: './dist',
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
      echo: {
        handler: 'handlers/echo.js',
        events: [
          {
            http: {
              path: '/echo',
              method: 'POST',
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