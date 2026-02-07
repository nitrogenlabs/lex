// Mock implementation of ora
const mockSpinner = {
  start: vi.fn().mockReturnThis(),
  stop: vi.fn().mockReturnThis(),
  succeed: vi.fn().mockReturnThis(),
  fail: vi.fn().mockReturnThis(),
  warn: vi.fn().mockReturnThis(),
  info: vi.fn().mockReturnThis(),
  text: '',
  color: 'cyan',
  isSpinning: false
};

const mockOra = vi.fn().mockImplementation(() => mockSpinner);

module.exports = () => ({
  start: vi.fn().mockReturnThis(),
  succeed: vi.fn().mockReturnThis(),
  fail: vi.fn().mockReturnThis(),
  stop: vi.fn().mockReturnThis(),
  info: vi.fn().mockReturnThis(),
  warn: vi.fn().mockReturnThis(),
  text: ''
});

module.exports.default = mockOra;