// jest.mock('execa', () => jest.fn().mockResolvedValue({
//   stdout: '',
//   stderr: '',
//   exitCode: 0,
//   command: 'mocked-command',
//   pid: 123
// }));

jest.mock('ora');

try {
  jest.mock('latest-version', () => jest.fn().mockResolvedValue('1.0.0'));
} catch (error) {
  jest.doMock('latest-version', () => jest.fn().mockResolvedValue('1.0.0'));
}

const originalReadFileSync = require('fs').readFileSync;
require('fs').readFileSync = jest.fn((path, encoding) => {
  if (path && path.toString().includes('package.json')) {
    return JSON.stringify({
      version: '1.0.0',
      dependencies: {
        esbuild: '^0.19.0',
        jest: '^29.0.0',
        typescript: '^5.0.0',
        webpack: '^5.0.0'
      }
    });
  }
  return originalReadFileSync(path, encoding);
});
