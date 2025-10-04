import {serverless} from './serverless.js';
import {log} from '../../utils/log.js';

jest.mock('execa');
jest.mock('boxen', () => jest.fn((text) => text));
jest.mock('chalk', () => ({
  blue: jest.fn((text) => text),
  bold: jest.fn((text) => text),
  cyan: jest.fn((text) => text),
  dim: jest.fn((text) => text),
  gray: jest.fn((text) => text),
  green: jest.fn((text) => text),
  magenta: jest.fn((text) => text),
  red: jest.fn((text) => text),
  white: jest.fn((text) => text),
  yellow: jest.fn((text) => text)
}));
jest.mock('express', () => {
  const mockApp = {
    delete: jest.fn(),
    get: jest.fn(),
    listen: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    static: jest.fn(),
    use: jest.fn()
  };
  return jest.fn(() => mockApp);
});
jest.mock('../../utils/app.js', () => ({
  createSpinner: jest.fn(() => ({
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn()
  })),
  removeFiles: jest.fn()
}));

// Mock the server creation to prevent actual server startup
jest.mock('http', () => ({
  createServer: jest.fn(() => ({
    close: jest.fn(),
    listen: jest.fn((port, host, callback) => {
      if(callback) {
        callback();
      }
    })
  }))
}));

jest.mock('ws', () => ({
  WebSocketServer: jest.fn(() => ({
    close: jest.fn(),
    on: jest.fn()
  }))
}));

jest.mock('../../LexConfig.js', () => ({
  LexConfig: {
    config: {
      outputFullPath: './lib'
    },
    parseConfig: jest.fn()
  }
}));

jest.mock('../../utils/log.js', () => ({
  log: jest.fn()
}));

// Mock fetch for public IP detection
global.fetch = jest.fn(() =>
  Promise.resolve({
    text: () => Promise.resolve('192.168.1.1')
  })
) as jest.Mock;

describe('serverless cli', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should start serverless server with default options', async () => {
    await serverless({test: true});

    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('Test mode: Environment variables loaded, exiting'),
      'info',
      false
    );
  });

  it('should start serverless server with custom host', async () => {
    await serverless({host: '0.0.0.0', test: true});

    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('Test mode: Environment variables loaded, exiting'),
      'info',
      false
    );
  });

  it('should start serverless server with custom ports', async () => {
    await serverless({
      httpPort: 4000,
      httpsPort: 4001,
      test: true,
      wsPort: 4002
    });

    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('Test mode: Environment variables loaded, exiting'),
      'info',
      false
    );
  });

  it('should start serverless server with usePublicIp option', async () => {
    await serverless({test: true, usePublicIp: true});

    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('Test mode: Environment variables loaded, exiting'),
      'info',
      false
    );
  });

  it('should start serverless server with remove option', async () => {
    await serverless({remove: true, test: true});

    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('Test mode: Environment variables loaded, exiting'),
      'info',
      false
    );
  });

  it('should start serverless server with quiet option', async () => {
    await serverless({quiet: true, test: true});

    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('Test mode: Environment variables loaded, exiting'),
      'info',
      true
    );
  });

  it('should start serverless server with custom config', async () => {
    await serverless({config: './custom.config.mjs', test: true});

    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('Test mode: Environment variables loaded, exiting'),
      'info',
      false
    );
  });

  it('should start serverless server with variables', async () => {
    await serverless({test: true, variables: '{"NODE_ENV":"test"}'});

    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('Test mode: Environment variables loaded, exiting'),
      'info',
      false
    );
  });
});