// Mock implementation of chalk
const createChalkMock = (text) => text;

const chalkMock = {
  red: createChalkMock,
  green: createChalkMock,
  blue: createChalkMock,
  yellow: createChalkMock,
  cyan: createChalkMock,
  magenta: createChalkMock,
  white: createChalkMock,
  gray: createChalkMock,
  grey: createChalkMock,
  black: createChalkMock,
  bold: createChalkMock,
  dim: createChalkMock,
  italic: createChalkMock,
  underline: createChalkMock,
  strikethrough: createChalkMock
};

module.exports = chalkMock;
module.exports.default = chalkMock;