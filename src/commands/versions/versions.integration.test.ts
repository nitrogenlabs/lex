import {jsonVersions, packages, parseVersion, versions} from './versions.js';
import {log} from '../../utils/log.js';


jest.mock('execa');
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    start: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn()
  }))
}));
jest.mock('../../utils/log.js');

describe('versions.integration', () => {
  const mockExit = jest.fn();
  const mockLog = log as jest.MockedFunction<typeof log>;
  const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

  beforeEach(() => {
    mockExit.mockClear();
    mockLog.mockClear();
    mockConsoleLog.mockClear();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should parse version correctly', () => {
    expect(parseVersion('^1.0.0')).toBe('1.0.0');
    expect(parseVersion('1.0.0')).toBe('1.0.0');
    expect(parseVersion('^1.2.3')).toBe('1.2.3');
    expect(parseVersion(undefined as unknown as string)).toBe(undefined);
  });

  it('should create JSON versions correctly', () => {
    const mockPackages = {
      esbuild: '1.0.0',
      jest: '2.0.0'
    };

    const result = jsonVersions(mockPackages);

    expect(result).toEqual({
      esbuild: packages.esbuild,
      jest: packages.jest
    });
  });

  it('should log versions in text format', async () => {
    await versions({}, mockExit);

    expect(mockLog).toHaveBeenCalledWith('Versions:', 'info', false);
    expect(mockLog).toHaveBeenCalledWith(`  Lex: ${packages.lex}`, 'info', false);
    expect(mockLog).toHaveBeenCalledWith('  ----------', 'note', false);
    expect(mockLog).toHaveBeenCalledWith(`  ESBuild: ${packages.esbuild}`, 'info', false);
    expect(mockLog).toHaveBeenCalledWith(`  Jest: ${packages.jest}`, 'info', false);
    expect(mockLog).toHaveBeenCalledWith(`  Typescript: ${packages.typescript}`, 'info', false);
    expect(mockLog).toHaveBeenCalledWith(`  Webpack: ${packages.webpack}`, 'info', false);
  });
});