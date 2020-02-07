import {attach} from './comments';
import {normalize} from './options';

export const textToDoc = (text: string, partialNextOptions, parentOptions, printAstToDoc) => {
  let updatedText: string = text;
  const nextOptions = normalize(
    {
      ...parentOptions,
      ...partialNextOptions,
      parentParser: parentOptions.parser,
      embeddedInHtml: !!(
        parentOptions.embeddedInHtml ||
        parentOptions.parser === 'html' ||
        parentOptions.parser === 'vue' ||
        parentOptions.parser === 'angular' ||
        parentOptions.parser === 'lwc'
      ),
      originalText: updatedText
    },
    {passThrough: true}
  );

  const result = require('./parser').parse(updatedText, nextOptions);
  const {ast, text: resultText} = result;
  updatedText = resultText;

  const astComments = ast.comments;
  delete ast.comments;
  attach(astComments, ast, text, nextOptions);
  return printAstToDoc(ast, nextOptions);
};

export const printSubtree = (path, print, options, printAstToDoc) => {
  if(options.printer.embed) {
    return options.printer.embed(
      path,
      print,
      (text, partialNextOptions) => textToDoc(text, partialNextOptions, options, printAstToDoc),
      options
    );
  }
};
