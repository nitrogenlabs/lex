export const createError = (message, loc) => {
  // Construct an error similar to the ones thrown by Babel.
  const error: any = new SyntaxError(`${message} (${loc.start.line}:${loc.start.column})`);
  error.loc = loc;
  return error;
};
