import {SFDocument} from './doc.types';


// Using a unique object to compare by reference.
const traverseDocOnExitStackMarker: SFDocument = {};

const traverseDoc = (document: SFDocument, onEnter, onExit?, shouldTraverseConditionalGroups: boolean = false) => {
  const documentStack = [document];

  while(documentStack.length !== 0) {
    const document = documentStack.pop();

    if(document === traverseDocOnExitStackMarker) {
      onExit(documentStack.pop());
      continue;
    }

    let shouldRecurse = true;
    if(onEnter) {
      if(onEnter(document) === false) {
        shouldRecurse = false;
      }
    }

    if(onExit) {
      documentStack.push(document);
      documentStack.push(traverseDocOnExitStackMarker);
    }

    if(shouldRecurse) {
      // When there are multiple parts to process,
      // the parts need to be pushed onto the stack in reverse order,
      // so that they are processed in the original order
      // when the stack is popped.
      const {breakContents, contents, expandedStates, flatContents, parts, type} = document;

      if(type === 'concat' || type === 'fill') {
        for(let ic = parts.length, i = ic - 1; i >= 0; --i) {
          documentStack.push(parts[i]);
        }
      } else if(type === 'if-break') {
        if(flatContents) {
          documentStack.push(flatContents);
        }
        if(breakContents) {
          documentStack.push(breakContents);
        }
      } else if(type === 'group' && expandedStates) {
        if(shouldTraverseConditionalGroups) {
          for(let ic = expandedStates.length, i = ic - 1; i >= 0; --i) {
            documentStack.push(expandedStates[i]);
          }
        } else {
          documentStack.push(contents);
        }
      } else if(contents) {
        documentStack.push(contents);
      }
    }
  }
};

const mapDoc = (document: SFDocument, cb) => {
  const {breakContents, contents, flatContents, parts, type} = document;

  if(type === 'concat' || type === 'fill') {
    const mappedParts = parts.map((part) => mapDoc(part, cb));
    return cb({...document, parts: mappedParts});
  } else if(type === 'if-break') {
    const mappedBreakContents = breakContents && mapDoc(breakContents, cb);
    const mappedFlatContents = flatContents && mapDoc(flatContents, cb);
    return cb({...document, breakContents: mappedBreakContents, flatContents: mappedFlatContents});
  } else if(contents) {
    const mappedContents = mapDoc(contents, cb);
    return cb({...document, contents: mappedContents});
  }

  return cb(document);
};

export const findInDoc = (document: SFDocument, fn, defaultValue) => {
  let result = defaultValue;
  let hasStopped: boolean = false;

  const findInDocOnEnterFn = (document) => {
    const maybeResult = fn(document);

    if(maybeResult !== undefined) {
      hasStopped = true;
      result = maybeResult;
    }
    if(hasStopped) {
      return false;
    }

    return undefined;
  };

  traverseDoc(document, findInDocOnEnterFn);
  return result;
};

export const isLineNextFn = (document: SFDocument): boolean => {
  if(typeof document === 'string') {
    return false;
  }
  if(document.type === 'line') {
    return true;
  }
};

export const isLineNext = (document: SFDocument) => findInDoc(document, isLineNextFn, false);

export const willBreakFn = (document: SFDocument): boolean => {
  const {break: documentBreak, hard, type} = document;

  if(type === 'group' && documentBreak) {
    return true;
  }
  if(type === 'line' && hard) {
    return true;
  }
  if(type === 'break-parent') {
    return true;
  }
};

export const willBreak = (document: SFDocument): boolean => findInDoc(document, willBreakFn, false);

export const breakParentGroup = (groupStack) => {
  if(groupStack.length > 0) {
    const parentGroup = groupStack[groupStack.length - 1];
    // Breaks are not propagated through conditional groups because
    // the user is expected to manually handle what breaks.
    if(!parentGroup.expandedStates) {
      parentGroup.break = true;
    }
  }
  return null;
};

export const propagateBreaks = (document: SFDocument) => {
  const alreadyVisitedSet = new Set();
  const groupStack: any[] = [];

  const propagateBreaksOnEnterFn = (document: SFDocument) => {
    if(document.type === 'break-parent') {
      breakParentGroup(groupStack);
    }

    if(document.type === 'group') {
      groupStack.push(document);

      if(alreadyVisitedSet.has(document)) {
        return false;
      }
      alreadyVisitedSet.add(document);
    }
  };

  const propagateBreaksOnExitFn = (document: SFDocument) => {
    if(document.type === 'group') {
      const group = groupStack.pop();

      if(group.break) {
        breakParentGroup(groupStack);
      }
    }
  };

  traverseDoc(
    document,
    propagateBreaksOnEnterFn,
    propagateBreaksOnExitFn,
    /* shouldTraverseConditionalGroups */ true
  );
};

export const removeLinesFn = (document: SFDocument) => {
  const {flatContents, hard, type, soft} = document;

  // Force this document into flat mode by statically converting all
  // lines into spaces (or soft lines into nothing). Hard lines
  // should still output because there's too great of a chance
  // of breaking existing assumptions otherwise.
  if(type === 'line' && !hard) {
    return soft ? '' : ' ';
  } else if(type === 'if-break') {
    return flatContents || '';
  }

  return document;
};

export const removeLines = (document: SFDocument) => mapDoc(document, removeLinesFn);

export const stripTrailingHardline = (document: SFDocument): SFDocument => {
  const {parts, type} = document;

  // HACK remove ending hardline, original PR: #1984
  if(type === 'concat' && parts.length !== 0) {
    const lastPart = parts[parts.length - 1];
    const {parts: lastParts, type: lastType} = lastPart;

    if(lastType === 'concat') {
      if(
        lastParts.length === 2 &&
        lastParts[0].hard &&
        lastParts[1].type === 'break-parent'
      ) {
        return {type: 'concat', parts: parts.slice(0, -1)};
      }

      return {
        type: 'concat',
        parts: parts.slice(0, -1).concat(stripTrailingHardline(lastPart))
      };
    }
  }

  return document;
};
