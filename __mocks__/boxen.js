// Mock implementation of boxen
const mockBoxen = jest.fn().mockImplementation((text, options) => `[BOXED] ${text}`);

module.exports = mockBoxen;
module.exports.default = mockBoxen;