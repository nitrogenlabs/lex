import cloneDeep from 'lodash/cloneDeep';

import {getLast} from '../../utils/getLast';

export const locStart = (node, opts: any = {}) => {
  // Handle nodes with decorators. They should start at the first decorator
  if(
    !opts.ignoreDecorators &&
    node.declaration &&
    node.declaration.decorators &&
    node.declaration.decorators.length > 0
  ) {
    return locStart(node.declaration.decorators[0]);
  }
  if(!opts.ignoreDecorators && node.decorators && node.decorators.length > 0) {
    return locStart(node.decorators[0]);
  }

  if(node.__location) {
    return node.__location.startOffset;
  }
  if(node.range) {
    return node.range[0];
  }
  if(typeof node.start === 'number') {
    return node.start;
  }
  if(node.loc) {
    return node.loc.start;
  }
  return null;
};

export const locEnd = (node) => {
  let updatedNode = cloneDeep(node);
  const endNode = updatedNode.nodes && getLast(updatedNode.nodes);

  if(endNode && updatedNode.source && !updatedNode.source.end) {
    updatedNode = endNode;
  }

  if(updatedNode.__location) {
    return updatedNode.__location.endOffset;
  }

  const loc = updatedNode.range
    ? updatedNode.range[1]
    : typeof updatedNode.end === 'number'
      ? updatedNode.end
      : null;

  if(updatedNode.typeAnnotation) {
    return Math.max(loc, locEnd(updatedNode.typeAnnotation));
  }

  if(updatedNode.loc && !loc) {
    return updatedNode.loc.end;
  }

  return loc;
};

export const composeLoc = (startNode, endNode = startNode) => {
  const loc: any = {};
  if(typeof startNode.start === 'number') {
    loc.start = startNode.start;
    loc.end = endNode.end;
  }
  if(Array.isArray(startNode.range)) {
    loc.range = [startNode.range[0], endNode.range[1]];
  }
  loc.loc = {
    start: startNode.loc.start,
    end: endNode.loc.end
  };
  return loc;
};
