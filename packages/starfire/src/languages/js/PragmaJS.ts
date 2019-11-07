import {extract, parse, parseWithComments, print, strip} from 'jest-docblock';

export class PragmaJS {
  static hasPragma(text: string): boolean {
    const pragmas = Object.keys(parse(extract(text)));
    return pragmas.indexOf('starfire') !== -1 || pragmas.indexOf('format') !== -1;
  }

  static insertPragma(text: string): string {
    const parsedDocblock = parseWithComments(extract(text));
    const pragmas = {format: '', ...parsedDocblock.pragmas};
    const newDocblock: string = print({comments: parsedDocblock.comments.replace(/^(\s+?\r?\n)+/, ''), pragmas});
    const strippedText: string = strip(text);
    const separatingNewlines: string = strippedText.startsWith('\n') ? '\n' : '\n\n';

    return newDocblock + separatingNewlines + strippedText;
  }
}
