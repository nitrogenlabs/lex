export const handler = async (event, context) => {
  console.log('GraphQL handler started');
  console.log('Event:', JSON.stringify(event, null, 2));

  // Simulate GraphQL resolver logic
  const resolvers = {
    Query: {
      hello: () => {
        console.log('Resolver: hello called');
        return 'Hello from GraphQL!';
      },
      users: () => {
        console.log('Resolver: users called');
        return [
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
        ];
      }
    },
    Mutation: {
      signUp: (_, args) => {
        const user = args.user;
        console.log('Resolver: signUp called with user:', user);
        console.log('Processing signup for:', user.email);

        // Simulate some processing
        const userId = Math.floor(Math.random() * 1000);
        console.log('Generated user ID:', userId);

        return {
          userId,
          username: user.username,
          email: user.email
        };
      }
    }
  };

  try {
    // Parse the GraphQL request
    const body = JSON.parse(event.body);
    console.log('GraphQL Query:', body.query);
    console.log('GraphQL Variables:', body.variables);

    // Simulate GraphQL execution
    if (body.query.includes('signUp')) {
      console.log('Executing signUp mutation');
      // Extract user data from the query since we're not using a real GraphQL parser
      const userMatch = body.query.match(/signUp\(user:\s*{([^}]+)}\)/);
      if (userMatch) {
        const userData = userMatch[1];
        const emailMatch = userData.match(/email:\s*"([^"]+)"/);
        const passwordMatch = userData.match(/password:\s*"([^"]+)"/);
        const usernameMatch = userData.match(/username:\s*"([^"]+)"/);
        const confirmMatch = userData.match(/confirm:\s*"([^"]+)"/);

        const user = {
          email: emailMatch ? emailMatch[1] : '',
          password: passwordMatch ? passwordMatch[1] : '',
          username: usernameMatch ? usernameMatch[1] : '',
          confirm: confirmMatch ? confirmMatch[1] : ''
        };

        const result = resolvers.Mutation.signUp(null, { user });
        console.log('SignUp result:', result);

        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            data: {
              users: {
                signUp: result
              }
            }
          })
        };
      }
    } else if (body.query.includes('hello')) {
      console.log('Executing hello query');
      const result = resolvers.Query.hello();
      console.log('Hello result:', result);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            hello: result
          }
        })
      };
    } else if (body.query.includes('users')) {
      console.log('Executing users query');
      const result = resolvers.Query.users();
      console.log('Users result:', result);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            users: result
          }
        })
      };
    }

    console.log('No matching query found');
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        errors: [{ message: 'Query not supported' }]
      })
    };
  } catch (error) {
    console.error('GraphQL handler error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        errors: [{ message: error.message }]
      })
    };
  }
};