jest.mock("url", () => ({
  URL: jest.fn(() => ({ pathname: "./" })),
}));
