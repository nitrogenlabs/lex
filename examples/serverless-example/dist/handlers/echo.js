export const handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'Echo response',
      receivedData: event.body,
      path: event.path,
      method: event.httpMethod,
      timestamp: new Date().toISOString()
    })
  };
};