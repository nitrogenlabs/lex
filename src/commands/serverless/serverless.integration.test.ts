import {mkdirSync, rmSync, writeFileSync} from 'fs';
import {tmpdir} from 'os';
import {join} from 'path';

import {serverless} from './serverless.js';

describe('serverless integration', () => {
  let testDir: string;
  let originalCwd: string;
  let consoleLogSpy;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterAll(() => {
    consoleLogSpy.mockRestore();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = join(tmpdir(), `lex-serverless-test-${Date.now()}`);
    mkdirSync(testDir, {recursive: true});
    process.chdir(testDir);

    // Create package.json
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({
      name: 'test-serverless-project',
      version: '1.0.0',
      type: 'module'
    }, null, 2));

    // Create output directory
    mkdirSync(join(testDir, 'dist'), {recursive: true});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.chdir(originalCwd);
    try {
      rmSync(testDir, {recursive: true, force: true});
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should start serverless server with basic config', async () => {
    // Create a basic lex.config.mjs
    const configContent = `
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
              method: 'GET'
            }
          }
        ]
      }
    },
    custom: {
      'serverless-offline': {
        httpPort: 3000,
        wsPort: 3002
      }
    }
  }
};
`;
    writeFileSync(join(testDir, 'lex.config.mjs'), configContent);

    // Create a simple handler
    const handlerContent = `
export const handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from serverless!',
      event: event
    })
  };
};
`;
    mkdirSync(join(testDir, 'dist', 'handlers'), {recursive: true});
    writeFileSync(join(testDir, 'dist', 'handlers', 'hello.js'), handlerContent);

    // Test the serverless command
    const result = await serverless({
      quiet: true,
      httpPort: 3000,
      wsPort: 3002
    });

    expect(result).toBe(0);
  }, 10000);

  it('should handle missing config gracefully', async () => {
    const result = await serverless({
      quiet: true
    });

    expect(result).toBe(0);
  }, 10000);

  it('should handle invalid config gracefully', async () => {
    // Create an invalid config
    writeFileSync(join(testDir, 'lex.config.mjs'), 'export default { invalid: true };');

    const result = await serverless({
      quiet: true
    });

    expect(result).toBe(0);
  }, 10000);
});