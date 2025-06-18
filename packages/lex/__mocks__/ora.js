// Mock implementation of ora
const mockSpinner = {
  start: jest.fn().mockReturnThis(),
  stop: jest.fn().mockReturnThis(),
  succeed: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
  warn: jest.fn().mockReturnThis(),
  info: jest.fn().mockReturnThis(),
  text: '',
  color: 'cyan',
  isSpinning: false
};

const mockOra = jest.fn().mockImplementation(() => mockSpinner);

module.exports = mockOra;
module.exports.default = mockOra;