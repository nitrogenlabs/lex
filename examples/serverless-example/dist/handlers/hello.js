export const handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'Hello from serverless!',
      path: event.path,
      method: event.httpMethod,
      queryParams: event.queryStringParameters,
      timestamp: new Date().toISOString()
    })
  };
};