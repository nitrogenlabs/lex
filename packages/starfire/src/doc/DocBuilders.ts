import {SFCondtionalOptionsType} from '../types/doc';

export class DocBuilders {
  static lineSuffixBoundary = {type: 'line-suffix-boundary'};
  static breakParent = {type: 'break-parent'};
  static line = {type: 'line'};
  static softline = {type: 'line', soft: true};
  static cursor = {type: 'cursor', placeholder: Symbol('cursor')};

  static get hardline() {
    return DocBuilders.concat([{type: 'line', hard: true}, DocBuilders.breakParent]);
  }

  static get literalline() {
    return DocBuilders.concat([{type: 'line', hard: true, literal: true}, DocBuilders.breakParent]);
  }

  static assertDoc(val) {
    /* istanbul ignore if */
    if(!(typeof val === 'string' || (val !== null && typeof val.type === 'string'))) {
      throw new Error(`Value ${JSON.stringify(val)} is not a valid document`);
    }
  }

  static concat(parts): any {
    if(process.env.NODE_ENV !== 'production') {
      parts.forEach(DocBuilders.assertDoc);
    }

    // We cannot do this until we change `printJSXElement` to not
    // access the internals of a document directly.
    // if(parts.length === 1) {
    //   // If it's a single document, no need to concat it.
    //   return parts[0];
    // }
    return {type: 'concat', parts};
  }

  static indent(contents): any {
    if(process.env.NODE_ENV !== 'production') {
      DocBuilders.assertDoc(contents);
    }

    return {type: 'indent', contents};
  }

  static align(n, contents) {
    if(process.env.NODE_ENV !== 'production') {
      DocBuilders.assertDoc(contents);
    }

    return {type: 'align', contents, n};
  }

  static group(contents, opts: SFCondtionalOptionsType = {}) {
    if(process.env.NODE_ENV !== 'production') {
      DocBuilders.assertDoc(contents);
    }

    return {
      break: !!opts.shouldBreak,
      contents,
      expandedStates: opts.expandedStates,
      type: 'group'
    };
  }

  static dedentToRoot(contents) {
    return DocBuilders.align(-Infinity, contents);
  }

  static markAsRoot(contents) {
    return DocBuilders.align({type: 'root'}, contents);
  }

  static dedent(contents) {
    return DocBuilders.align(-1, contents);
  }

  static conditionalGroup(states, opts = {}) {
    return DocBuilders.group(states[0], {...opts, expandedStates: states}
    );
  }

  static fill(parts) {
    if(process.env.NODE_ENV !== 'production') {
      parts.forEach(DocBuilders.assertDoc);
    }

    return {type: 'fill', parts};
  }

  static ifBreak(breakContents, flatContents?) {
    if(process.env.NODE_ENV !== 'production') {
      if(breakContents) {
        DocBuilders.assertDoc(breakContents);
      }

      if(flatContents) {
        DocBuilders.assertDoc(flatContents);
      }
    }

    return {type: 'if-break', breakContents, flatContents};
  }

  static lineSuffix(contents) {
    if(process.env.NODE_ENV !== 'production') {
      DocBuilders.assertDoc(contents);
    }

    return {type: 'line-suffix', contents};
  }

  static join(separator, arr) {
    const res = [];

    arr.forEach((item, index: number) => {
      if(index !== 0) {
        res.push(separator);
      }

      res.push(item);
    });

    return DocBuilders.concat(res);
  }

  static addAlignmentToDoc(doc, size: number, tabWidth: number) {
    let aligned = doc;

    if(size > 0) {
      // Use indent to add tabs for all the levels of tabs we need
      for(let i = 0; i < Math.floor(size / tabWidth); ++i) {
        aligned = DocBuilders.indent(aligned);
      }
      // Use align for all the spaces that are needed
      aligned = DocBuilders.align(size % tabWidth, aligned);
      // size is absolute from 0 and not relative to the current
      // indentation, so we use -Infinity to reset the indentation to 0
      aligned = DocBuilders.align(-Infinity, aligned);
    }

    return aligned;
  }
}
