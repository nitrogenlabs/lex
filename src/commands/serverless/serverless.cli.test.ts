import {execa} from 'execa';

import {serverless} from './serverless.js';

jest.mock('execa');
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    start: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn()
  }))
}));

// Mock the server creation to prevent actual server startup
jest.mock('http', () => ({
  createServer: jest.fn(() => ({
    listen: jest.fn((port, host, callback) => {
      if(callback) callback();
    }),
    close: jest.fn()
  }))
}));

jest.mock('ws', () => ({
  WebSocketServer: jest.fn(() => ({
    on: jest.fn(),
    close: jest.fn()
  }))
}));

describe('serverless cli', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('should start serverless server with default options', async () => {
    await serverless({});

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Lex starting serverless development server')
    );
  });

  it('should start serverless server with custom host', async () => {
    await serverless({host: '0.0.0.0'});

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Lex starting serverless development server')
    );
  });

  it('should start serverless server with custom ports', async () => {
    await serverless({
      httpPort: 4000,
      httpsPort: 4001,
      wsPort: 4002
    });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Lex starting serverless development server')
    );
  });

  it('should start serverless server with usePublicIp option', async () => {
    await serverless({usePublicIp: true});

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Lex starting serverless development server')
    );
  });

  it('should start serverless server with remove option', async () => {
    await serverless({remove: true});

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Lex starting serverless development server')
    );
  });

  it('should start serverless server with quiet option', async () => {
    await serverless({quiet: true});

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Lex starting serverless development server')
    );
  });

  it('should start serverless server with custom config', async () => {
    await serverless({config: './custom.config.mjs'});

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Lex starting serverless development server')
    );
  });

  it('should start serverless server with variables', async () => {
    await serverless({variables: '{"NODE_ENV":"test"}'});

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Lex starting serverless development server')
    );
  });
});