// Mock implementation of chalk
const createChalkMock = (text) => text;

// Create a simple mock that returns itself for method chaining
const chalkMock = (text) => text;

// Add all chalk methods to the mock function
chalkMock.red = chalkMock;
chalkMock.green = chalkMock;
chalkMock.blue = chalkMock;
chalkMock.yellow = chalkMock;
chalkMock.cyan = chalkMock;
chalkMock.magenta = chalkMock;
chalkMock.white = chalkMock;
chalkMock.gray = chalkMock;
chalkMock.grey = chalkMock;
chalkMock.black = chalkMock;
chalkMock.bold = chalkMock;
chalkMock.dim = chalkMock;
chalkMock.italic = chalkMock;
chalkMock.underline = chalkMock;
chalkMock.strikethrough = chalkMock;

module.exports = chalkMock;
module.exports.default = chalkMock;