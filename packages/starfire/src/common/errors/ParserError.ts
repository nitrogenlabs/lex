export class ParserError extends SyntaxError {
  loc;

  constructor(message, loc) {
    super(`${message} (${loc.start.line}:${loc.start.column})`);
    this.loc = loc;
  }
}
