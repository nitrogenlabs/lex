// Mock implementation of boxen
const mockBoxen = jest.fn().mockImplementation((text, options) => {
  return `[BOXED] ${text}`;
});

module.exports = mockBoxen;
module.exports.default = mockBoxen;