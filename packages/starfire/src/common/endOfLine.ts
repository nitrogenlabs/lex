export const guessEndOfLine = (text) => {
  const index = text.indexOf('\r');
  if(index >= 0) {
    return text.charAt(index + 1) === '\n' ? 'crlf' : 'cr';
  }
  return 'lf';
};

export const convertEndOfLineToChars = (value) => {
  switch(value) {
    case 'cr':
      return '\r';
    case 'crlf':
      return '\r\n';
    default:
      return '\n';
  }
};
