export class DocUtils {
  static traverseDoc(document, onEnter, onExit?, shouldTraverseConditionalGroups?) {
    const traverseDocRec = (doc) => {
      let shouldRecurse: boolean = true;

      if(onEnter) {
        if(onEnter(doc) === false) {
          shouldRecurse = false;
        }
      }

      if(shouldRecurse) {
        if(doc.type === 'concat' || doc.type === 'fill') {
          doc.parts.forEach((part) => {
            traverseDocRec(part);
          });
        } else if(doc.type === 'if-break') {
          if(doc.breakContents) {
            traverseDocRec(doc.breakContents);
          }
          if(doc.flatContents) {
            traverseDocRec(doc.flatContents);
          }
        } else if(doc.type === 'group' && doc.expandedStates) {
          if(shouldTraverseConditionalGroups) {
            doc.expandedStates.forEach(traverseDocRec);
          } else {
            traverseDocRec(doc.contents);
          }
        } else if(doc.contents) {
          traverseDocRec(doc.contents);
        }
      }

      if(onExit) {
        onExit(doc);
      }
    };

    traverseDocRec(document);
  }

  static mapDoc(doc, func) {
    doc = func(doc);

    if(doc.type === 'concat' || doc.type === 'fill') {
      return {...doc, parts: doc.parts.map((d) => DocUtils.mapDoc(d, func))};
    } else if(doc.type === 'if-break') {
      return {
        ...doc,
        breakContents: doc.breakContents && DocUtils.mapDoc(doc.breakContents, func),
        flatContents: doc.flatContents && DocUtils.mapDoc(doc.flatContents, func)
      };
    } else if(doc.contents) {
      return {...doc, contents: DocUtils.mapDoc(doc.contents, func)};
    }

    return doc;
  }

  static findInDoc(document, fn, defaultValue) {
    let result = defaultValue;
    let hasStopped = false;
    DocUtils.traverseDoc(document, (doc) => {
      const maybeResult = fn(doc);

      if(maybeResult !== undefined) {
        hasStopped = true;
        result = maybeResult;
      }

      if(hasStopped) {
        return false;
      }

      return true;
    });

    return result;
  }

  static isEmpty(n) {
    return typeof n === 'string' && n.length === 0;
  }

  static isLineNext(document) {
    return DocUtils.findInDoc(
      document,
      (doc) => {
        if(typeof doc === 'string') {
          return false;
        }

        if(doc.type === 'line') {
          return true;
        }

        return false;
      },
      false
    );
  }

  static willBreak(document) {
    return DocUtils.findInDoc(
      document,
      (doc) => {
        if(doc.type === 'group' && doc.break) {
          return true;
        }

        if(doc.type === 'line' && doc.hard) {
          return true;
        }

        if(doc.type === 'break-parent') {
          return true;
        }

        return false;
      },
      false
    );
  }

  static breakParentGroup(groupStack) {
    if(groupStack.length > 0) {
      const parentGroup = groupStack[groupStack.length - 1];
      // Breaks are not propagated through conditional groups because
      // the user is expected to manually handle what breaks.
      if(!parentGroup.expandedStates) {
        parentGroup.break = true;
      }
    }

    return null;
  }

  static propagateBreaks(doc) {
    const alreadyVisited = new Map();
    const groupStack = [];
    DocUtils.traverseDoc(doc, (groupDoc) => {
      if(groupDoc.type === 'break-parent') {
        DocUtils.breakParentGroup(groupStack);
      }

      if(groupDoc.type === 'group') {
        groupStack.push(groupDoc);

        if(alreadyVisited.has(groupDoc)) {
          return false;
        }

        alreadyVisited.set(groupDoc, true);
      }

      return false;
    },
    (groupDoc) => {
      if(groupDoc.type === 'group') {
        const group = groupStack.pop();

        if(group.break) {
          DocUtils.breakParentGroup(groupStack);
        }
      }
    },
    true
    );
  }

  static removeLines(doc) {
    // Force this doc into flat mode by statically converting all
    // lines into spaces (or soft lines into nothing). Hard lines
    // should still output because there's too great of a chance
    // of breaking existing assumptions otherwise.
    return DocUtils.mapDoc(doc, (d) => {
      if(d.type === 'line' && !d.hard) {
        return d.soft ? '' : ' ';
      } else if(d.type === 'if-break') {
        return d.flatContents || '';
      }
      return d;
    });
  }

  static stripTrailingHardline(doc) {
    // HACK remove ending hardline, original PR: #1984
    if(
      doc.type === 'concat' &&
      doc.parts.length === 2 &&
      doc.parts[1].type === 'concat' &&
      doc.parts[1].parts.length === 2 &&
      doc.parts[1].parts[0].hard &&
      doc.parts[1].parts[1].type === 'break-parent'
    ) {
      return doc.parts[0];
    }

    return doc;
  }

  static rawText(node) {
    return node.extra ? node.extra.raw : node.raw;
  }
}
