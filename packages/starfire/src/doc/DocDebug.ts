export class DocDebug {
  static flattenDoc(doc) {
    if(doc.type === 'concat') {
      const res = [];

      doc.parts.forEach((part) => {
        if(typeof part !== 'string' && part.type === 'concat') {
          [].push.apply(res, DocDebug.flattenDoc(part).parts);
        } else {
          const flattened = DocDebug.flattenDoc(part);

          if(flattened !== '') {
            res.push(flattened);
          }
        }
      });

      return {...doc, parts: res};
    } else if(doc.type === 'if-break') {
      return {
        ...doc,
        breakContents:
          doc.breakContents !== null ? DocDebug.flattenDoc(doc.breakContents) : null,
        flatContents:
          doc.flatContents !== null ? DocDebug.flattenDoc(doc.flatContents) : null
      };
    } else if(doc.type === 'group') {
      return {
        ...doc,
        contents: DocDebug.flattenDoc(doc.contents),
        expandedStates: doc.expandedStates
          ? doc.expandedStates.map(DocDebug.flattenDoc)
          : doc.expandedStates
      };
    } else if(doc.contents) {
      return {...doc, contents: DocDebug.flattenDoc(doc.contents)};
    }
    return doc;
  }

  static printDoc(doc): string {
    if(typeof doc === 'string') {
      return JSON.stringify(doc);
    }

    if(doc.type === 'line') {
      if(doc.literalline) {
        return 'literalline';
      }

      if(doc.hard) {
        return 'hardline';
      }

      if(doc.soft) {
        return 'softline';
      }

      return 'line';
    }

    if(doc.type === 'break-parent') {
      return 'breakParent';
    }

    if(doc.type === 'concat') {
      return `[${doc.parts.map(DocDebug.printDoc).join(', ')}]`;
    }

    if(doc.type === 'indent') {
      return `indent(${DocDebug.printDoc(doc.contents)})`;
    }

    if(doc.type === 'align') {
      return doc.n === -Infinity
        ? `dedentToRoot(${DocDebug.printDoc(doc.contents)})`
        : doc.n < 0
          ? `dedent(${DocDebug.printDoc(doc.contents)})`
          : doc.n.type === 'root'
            ? `markAsRoot(${DocDebug.printDoc(doc.contents)})`
            : `align(${
              JSON.stringify(doc.n)
            }, ${
              DocDebug.printDoc(doc.contents)
            })`;
    }

    if(doc.type === 'if-break') {
      return `ifBreak(${DocDebug.printDoc(doc.breakContents)}` +
        `${doc.flatContents ? `, ${DocDebug.printDoc(doc.flatContents)}` : ''})`;
    }

    if(doc.type === 'group') {
      if(doc.expandedStates) {
        return `conditionalGroup([${doc.expandedStates.map(DocDebug.printDoc).join(',')}])`;
      }

      return `${doc.break ? 'wrappedGroup' : 'group'}(${DocDebug.printDoc(doc.contents)})`;
    }

    if(doc.type === 'fill') {
      return `fill(${doc.parts.map(DocDebug.printDoc).join(', ')})`;
    }

    if(doc.type === 'line-suffix') {
      return `lineSuffix(${DocDebug.printDoc(doc.contents)})`;
    }

    if(doc.type === 'line-suffix-boundary') {
      return 'lineSuffixBoundary';
    }

    throw new Error(`Unknown doc type ${doc.type}`);
  }

  static printDocToDebug(doc) {
    return DocDebug.printDoc(DocDebug.flattenDoc(doc));
  }
}
