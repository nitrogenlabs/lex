// Mock implementation of execa
const mockExeca = jest.fn().mockImplementation(() =>
  Promise.resolve({
    stdout: '',
    stderr: '',
    exitCode: 0,
    command: 'mocked-command',
    pid: 123
  })
);

mockExeca.sync = jest.fn().mockImplementation(() => ({
  stdout: '',
  stderr: '',
  exitCode: 0,
  command: 'mocked-command',
  pid: 123
}));

module.exports = {
  execa: mockExeca,
  default: mockExeca
};