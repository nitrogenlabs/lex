import {execa} from 'execa';

import {update, UpdateCallback} from './update.js';

vi.mock('execa');
vi.mock('../../LexConfig.js', async () => ({
  LexConfig: {
    config: {
      packageManager: 'npm'
    },
    parseConfig: vi.fn().mockResolvedValue(undefined)
  }
}));
vi.mock('../../utils/file.js', async () => ({
  getDirName: vi.fn(() => '/mock/dir')
}));
vi.mock('../../utils/app.js', async () => ({
  ...await vi.importActual('../../utils/app.js'),
  createSpinner: vi.fn(() => ({
    fail: vi.fn(),
    start: vi.fn(),
    succeed: vi.fn()
  }))
}));

describe('update.cli', () => {
  const mockExit = vi.fn() as unknown as MockedFunction<UpdateCallback>;
  const mockExeca = execa as MockedFunction<typeof execa>;

  beforeEach(() => {
    mockExit.mockClear();
    mockExeca.mockClear();
  });

  afterAll(() => {
    vi.restoreAllMocks();
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