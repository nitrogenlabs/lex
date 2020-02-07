import {SFDocument, SFDocumentOptions, SFPart} from './doc.types';

export const assertDoc = (val: SFPart) => {
  /* istanbul ignore if */
  if(!(typeof val === 'string' || (val !== null && typeof val.type === 'string'))) {
    throw new Error(`Value ${JSON.stringify(val)} is not a valid document`);
  }
};

export const concat = (parts: SFPart[]): SFDocument => {
  if(process.env.NODE_ENV !== 'production') {
    parts.forEach(assertDoc);
  }

  // We cannot do this until we change `printJSXElement` to not
  // access the internals of a document directly.
  // if(parts.length === 1) {
  //   // If it's a single document, no need to concat it.
  //   return parts[0];
  // }
  return {type: 'concat', parts};
};

/**
 * @param {Doc} contents
 * @returns Doc
 */
export const indent = (contents: SFDocument): SFDocument => {
  if(process.env.NODE_ENV !== 'production') {
    assertDoc(contents);
  }

  return {type: 'indent', contents};
};

export const align = (n: SFDocument | number, contents: SFDocument): SFDocument => {
  if(process.env.NODE_ENV !== 'production') {
    assertDoc(contents);
  }

  return {type: 'align', contents, n};
};

export const group = (contents: SFDocument, opts: SFDocumentOptions = {}): SFDocument => {
  const {expandedStates, id, shouldBreak} = opts;

  if(process.env.NODE_ENV !== 'production') {
    assertDoc(contents);
  }

  return {
    break: !!shouldBreak,
    contents,
    expandedStates,
    id,
    type: 'group'
  };
};

export const dedentToRoot = (contents: SFDocument): SFDocument => align(-Infinity, contents);
export const markAsRoot = (contents: SFDocument): SFDocument => align({type: 'root'}, contents);
export const dedent = (contents: SFDocument): SFDocument => align(-1, contents);

export const conditionalGroup = (states: SFDocument[], opts: SFDocumentOptions = {}): SFDocument => group(
  states[0],
  {...opts, expandedStates: states}
);

export const fill = (parts: SFDocument[]): SFDocument => {
  if(process.env.NODE_ENV !== 'production') {
    parts.forEach(assertDoc);
  }

  return {type: 'fill', parts};
};

export const ifBreak = (
  breakContents: SFDocument,
  flatContents: SFDocument,
  opts: SFDocumentOptions = {}
): SFDocument => {
  if(process.env.NODE_ENV !== 'production') {
    if(breakContents) {
      assertDoc(breakContents);
    }
    if(flatContents) {
      assertDoc(flatContents);
    }
  }

  return {
    type: 'if-break',
    breakContents,
    flatContents,
    groupId: opts.groupId
  };
};

export const lineSuffix = (contents: SFDocument): SFDocument => {
  if(process.env.NODE_ENV !== 'production') {
    assertDoc(contents);
  }

  return {type: 'line-suffix', contents};
};

export const lineSuffixBoundary: SFDocument = {type: 'line-suffix-boundary'};
export const breakParent: SFDocument = {type: 'break-parent'};
export const trim: SFDocument = {type: 'trim'};
export const line: SFDocument = {type: 'line'};
export const softline: SFDocument = {type: 'line', soft: true};
export const hardline: SFDocument = concat([{type: 'line', hard: true}, breakParent]);
export const literalline: SFDocument = concat([
  {type: 'line', hard: true, literal: true},
  breakParent
]);
export const cursor = {type: 'cursor', placeholder: Symbol('cursor')};

export const join = (sep: SFDocument, arr: SFDocument[]): SFDocument => {
  const res = [];

  for(let i = 0; i < arr.length; i++) {
    if(i !== 0) {
      res.push(sep);
    }

    res.push(arr[i]);
  }

  return concat(res);
};

export const addAlignmentToDoc = (doc: SFDocument, size: number, tabWidth: number) => {
  let aligned: SFDocument = doc;

  if(size > 0) {
    // Use indent to add tabs for all the levels of tabs we need
    for(let i = 0; i < Math.floor(size / tabWidth); ++i) {
      aligned = indent(aligned);
    }

    // Use align for all the spaces that are needed
    aligned = align(size % tabWidth, aligned);
    // size is absolute from 0 and not relative to the current
    // indentation, so we use -Infinity to reset the indentation to 0
    aligned = align(-Infinity, aligned);
  }

  return aligned;
};
