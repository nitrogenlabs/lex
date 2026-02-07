import {serverless} from './serverless.js';
import {log} from '../../utils/log.js';

vi.mock('execa');
vi.mock('boxen', () => vi.fn((text) => text));
vi.mock('chalk', async () => ({
  blue: vi.fn((text) => text),
  bold: vi.fn((text) => text),
  cyan: vi.fn((text) => text),
  dim: vi.fn((text) => text),
  gray: vi.fn((text) => text),
  green: vi.fn((text) => text),
  magenta: vi.fn((text) => text),
  red: vi.fn((text) => text),
  white: vi.fn((text) => text),
  yellow: vi.fn((text) => text)
}));
vi.mock('express', async () => {
  const mockApp = {
    delete: vi.fn(),
    get: vi.fn(),
    listen: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    static: vi.fn(),
    use: vi.fn()
  };
  return vi.fn(() => mockApp);
});
vi.mock('../../utils/app.js', async () => ({
  createSpinner: vi.fn(() => ({
    fail: vi.fn(),
    start: vi.fn(),
    succeed: vi.fn()
  })),
  removeFiles: vi.fn()
}));

// Mock the server creation to prevent actual server startup
vi.mock('http', async () => ({
  createServer: vi.fn(() => ({
    close: vi.fn(),
    listen: vi.fn((port, host, callback) => {
      if(callback) {
        callback();
      }
    })
  }))
}));

vi.mock('ws', async () => ({
  WebSocketServer: vi.fn(() => ({
    close: vi.fn(),
    on: vi.fn()
  }))
}));

vi.mock('../../LexConfig.js', async () => ({
  LexConfig: {
    config: {
      outputFullPath: './lib'
    },
    parseConfig: vi.fn()
  }
}));

vi.mock('../../utils/log.js', async () => ({
  log: vi.fn()
}));

// Mock fetch for public IP detection
global.fetch = vi.fn(() =>
  Promise.resolve({
    text: () => Promise.resolve('192.168.1.1')
  })
) as Mock;

describe('serverless cli', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
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