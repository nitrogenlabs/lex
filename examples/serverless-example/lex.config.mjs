export default {
  outputFullPath: './lib',
  serverless: {
    custom: {
      'serverless-offline': {
        cors: true,
        host: 'localhost',
        httpPort: 3000,
        httpsPort: 3001,
        wsPort: 3002
      }
    },
    functions: {
      echo: {
        events: [
          {
            http: {
              cors: true,
              method: 'POST',
              path: '/echo'
            }
          }
        ],
        handler: 'handlers/echo.js'
      },
      graphql: {
        events: [
          {
            http: {
              cors: true,
              method: 'POST',
              path: '/public'
            }
          }
        ],
        handler: 'handlers/graphql.js'
      },
      hello: {
        events: [
          {
            http: {
              cors: true,
              method: 'GET',
              path: '/hello'
            }
          }
        ],
        handler: 'handlers/hello.js'
      },
      test: {
        events: [
          {
            http: {
              cors: true,
              method: 'GET',
              path: '/test'
            }
          }
        ],
        handler: 'handlers/test.js'
      },
      websocket: {
        events: [
          {
            websocket: {
              route: '$default'
            }
          }
        ],
        handler: 'handlers/websocket.js'
      }
    }
  }
};