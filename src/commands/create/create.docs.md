# Create Module API Documentation

The create module provides functionality to create various project assets such as changelogs, stores, tsconfig files, views, and VSCode configurations.

## API

### `create(type: string, options: CreateOptions, callback?: CreateCallback): Promise<number>`

The main function that handles the creation of various project assets.

#### Parameters

- `type`: The type of asset to create. Supported values:
  - `'changelog'`: Creates a changelog file
  - `'datalayer'`: Creates a data layer for Lambda functions with test files
  - `'store'`: Creates a store with test files
  - `'tsconfig'`: Creates a TypeScript configuration file
  - `'view'`: Creates a view component with test files
  - `'vscode'`: Creates VSCode configuration
- `options`: An object containing the create configuration options
  - `cliName?: string` - Custom name for the CLI tool in output messages (defaults to "Lex")
  - `outputFile?: string` - Output file name for certain types (e.g., changelog)
  - `outputName?: string` - Name to use for the created asset (e.g., store or view name)
  - `quiet?: boolean` - Whether to suppress output
- `callback`: An optional callback function that receives the exit status code, defaults to an empty function

#### Returns

- `Promise<number>`: A promise that resolves to the exit code (0 for success, 1 for failure)

## Interfaces

### `CreateOptions`

```typescript
export interface CreateOptions {
  readonly cliName?: string;
  readonly outputFile?: string;
  readonly outputName?: string;
  readonly quiet?: boolean;
}
```

### `CreateCallback`

```typescript
export type CreateCallback = (status: number) => void;
```

## Features

- **Changelog Creation**: Creates a changelog file based on git history
- **Data Layer Creation**: Creates a data layer for Lambda functions with CRUD operations and test files
- **Store Creation**: Creates a store with appropriate test files
- **TSConfig Creation**: Creates a TypeScript configuration file
- **View Creation**: Creates a view component with CSS and test files
- **VSCode Configuration**: Creates VSCode configuration files
- **Error Handling**: Provides detailed error messages for common issues
- **Custom CLI Name**: Supports custom CLI name for output messages
- **Quiet Mode**: Supports suppressing output for automated usage

## Example Usage

```typescript
import { create } from '@nlabs/lex';

// Create a changelog
await create('changelog', {
  outputFile: 'CHANGELOG.md',
  quiet: false
});

// Create a data layer
await create('datalayer', {
  outputName: 'user',
  quiet: false
});

// Create a store
await create('store', {
  outputName: 'user',
  quiet: false
});

// Create a tsconfig file
await create('tsconfig', {
  quiet: false
});

// Create a view component
await create('view', {
  outputName: 'dashboard',
  quiet: false
});

// Create VSCode configuration
await create('vscode', {
  quiet: false
});

// With custom callback
await create('changelog', {}, (status) => {
  if (status === 0) {
    console.log('Creation completed successfully');
  } else {
    console.error('Creation failed');
  }
});
```

## Data Layer Features

The data layer creation generates a complete Lambda function with:

- **CRUD Operations**: Create, Read, Update, Delete operations for data management
- **HTTP Handler**: Built-in API Gateway integration with proper HTTP status codes
- **Error Handling**: Comprehensive error handling with proper Lambda response format
- **CORS Support**: Built-in CORS headers for web applications
- **TypeScript Support**: Full TypeScript support with proper AWS Lambda types
- **Test Coverage**: Complete test suite with Vitest for all operations
- **Environment Configuration**: Support for environment variables and configuration

### Generated Files

When you create a data layer named "user", it generates:

- `UserDataLayer/UserDataLayer.ts` (or `.js`) - Main data layer class
- `UserDataLayer/UserDataLayer.test.ts` (or `.js`) - Complete test suite

### Usage in Lambda

The generated data layer can be used directly as a Lambda handler:

```typescript
// In your lex.config.mjs
export default {
  serverless: {
    functions: {
      userApi: {
        handler: 'UserDataLayer/UserDataLayer.handler',
        events: [
          {
            http: {
              path: '/users/{id}',
              method: 'ANY',
              cors: true
            }
          }
        ]
      }
    }
  }
};
```

### API Endpoints

The data layer automatically handles these HTTP methods:

- `GET /users` - List all users
- `GET /users/{id}` - Get a specific user
- `POST /users` - Create a new user
- `PUT /users/{id}` - Update a user
- `DELETE /users/{id}` - Delete a user
