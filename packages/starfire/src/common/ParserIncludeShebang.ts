export class ParserIncludeShebang {
  static includeShebang(text, ast) {
    if(!text.startsWith('#!')) {
      return;
    }

    const index = text.indexOf('\n');
    const shebang = text.slice(2, index);
    const comment = {
      loc: {
        end: {
          column: index,
          line: 1
        },
        source: null,
        start: {
          column: 0,
          line: 1
        }
      },
      range: [0, index],
      type: 'Line',
      value: shebang
    };

    ast.comments = [comment].concat(ast.comments);
  }
}
