export const handler = async (event, context) => {
  const {routeKey, connectionId} = event.requestContext;

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'WebSocket message received',
      route: routeKey,
      connectionId,
      receivedData: event.body,
      timestamp: new Date().toISOString()
    })
  };
};