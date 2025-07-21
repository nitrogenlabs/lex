import {execa} from 'execa';

import {update, UpdateCallback} from './update.js';

jest.mock('execa');
jest.mock('../../LexConfig.js', () => ({
  LexConfig: {
    config: {
      packageManager: 'npm'
    },
    parseConfig: jest.fn().mockResolvedValue(undefined)
  }
}));
jest.mock('../../utils/file.js', () => ({
  getDirName: jest.fn(() => '/mock/dir')
}));
jest.mock('../../utils/app.js', () => ({
  ...jest.requireActual('../../utils/app.js'),
  createSpinner: jest.fn(() => ({
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn()
  }))
}));

describe('update.cli', () => {
  const mockExit = jest.fn() as unknown as jest.MockedFunction<UpdateCallback>;
  const mockExeca = execa as jest.MockedFunction<typeof execa>;

  beforeEach(() => {
    mockExit.mockClear();
    mockExeca.mockClear();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should update packages with npm', async () => {
    await update({packageManager: 'npm'}, mockExit);

    expect(mockExeca).toHaveBeenCalledWith('npx', expect.arrayContaining(['--packageManager', 'npm']), expect.any(Object));
    expect(mockExeca).toHaveBeenCalledWith('npm', ['i', '--force'], expect.any(Object));
    expect(mockExeca).toHaveBeenCalledWith('npm', ['audit', 'fix'], expect.any(Object));
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should handle interactive mode', async () => {
    await update({interactive: true, packageManager: 'npm'}, mockExit);

    expect(mockExeca).toHaveBeenCalledWith('npx', expect.arrayContaining(['--interactive']), expect.any(Object));
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should handle registry option', async () => {
    await update({packageManager: 'npm', registry: 'https://registry.npmjs.org'}, mockExit);

    expect(mockExeca).toHaveBeenCalledWith('npx', expect.arrayContaining(['--registry', 'https://registry.npmjs.org']), expect.any(Object));
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should handle errors', async () => {
    const errorMessage = 'Failed to update packages';
    mockExeca.mockRejectedValue(new Error(errorMessage));

    await update({}, mockExit);

    expect(mockExit).toHaveBeenCalledWith(1);
  });
});