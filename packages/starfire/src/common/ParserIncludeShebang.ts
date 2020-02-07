import {Comment} from './util.types';

export const includeShebang = (text: string, ast) => {
  if(!text.startsWith('#!')) {
    return;
  }

  const index: number = text.indexOf('\n');
  const shebang: string = text.slice(2, index);
  const comment: Comment = {
    type: 'Line',
    value: shebang,
    range: [0, index],
    loc: {
      source: null,
      start: {
        line: 1,
        column: 0
      },
      end: {
        line: 1,
        column: index
      }
    }
  };

  ast.comments = [comment].concat(ast.comments);
};
