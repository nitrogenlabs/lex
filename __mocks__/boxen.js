// Mock implementation of boxen
const mockBoxen = vi.fn().mockImplementation((text, options) => `[BOXED] ${text}`);

module.exports = mockBoxen;
module.exports.default = mockBoxen;