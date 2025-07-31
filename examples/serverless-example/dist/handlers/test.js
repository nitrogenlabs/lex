export const handler = async (event, context) => {
  console.log('Test handler called');
  console.log('Event:', event);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'Hello from test handler!',
      data: {
        test: true
      }
    })
  };
};