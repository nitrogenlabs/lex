import assert from 'assert';

import {Util} from '../common/Util';
import {DocBuilders} from '../doc/DocBuilders';

const childNodesCacheKey = Symbol('child-nodes');

export class Comments {
  static getSortedChildNodes(node, text: string, options, resultArray?) {
    if(!node) {
      return null;
    }

    const {locEnd, locStart, printer} = options;
    const updatedResultArray = resultArray ? [...resultArray] : [];

    if(resultArray) {
      if(node && printer.canAttachComment && printer.canAttachComment(node)) {
        // This reverse insertion sort almost always takes constant
        // time because we almost always (maybe always?) append the
        // nodes in order anyway.
        let index: number;
        for(index = updatedResultArray.length - 1; index >= 0; --index) {
          if(
            locStart(updatedResultArray[index]) <= locStart(node) &&
            locEnd(updatedResultArray[index]) <= locEnd(node)
          ) {
            break;
          }
        }
        updatedResultArray.splice(index + 1, 0, node);
        return null;
      }
    } else if(node[childNodesCacheKey]) {
      return node[childNodesCacheKey];
    }

    let childNodes;

    if(printer.getCommentChildNodes) {
      childNodes = printer.getCommentChildNodes(node);
    } else if(node && typeof node === 'object') {
      childNodes = Object.keys(node)
        .filter((key: string) => key !== 'enclosingNode' && key !== 'precedingNode' && key !== 'followingNode')
        .map((filteredNode) => node[filteredNode]);
    }

    if(!childNodes) {
      return null;
    }

    if(!resultArray) {
      Object.defineProperty(node, childNodesCacheKey, {enumerable: false, value: []});
    }

    childNodes.forEach((childNode) => {
      Comments.getSortedChildNodes(childNode, text, options, updatedResultArray);
    });

    return updatedResultArray;
  }

  // As efficiently as possible, decorate the comment object with
  // .precedingNode, .enclosingNode, and/or .followingNode properties, at
  // least one of which is guaranteed to be defined.
  static decorateComment(node, comment, text, options) {
    const {locStart} = options;
    const {locEnd} = options;
    const childNodes = Comments.getSortedChildNodes(node, text, options);
    let precedingNode;
    let followingNode;
    // Time to dust off the old binary search robes and wizard hat.
    let left: number = 0;
    let right: number = childNodes.length;

    while(left < right) {
      const middle = (left + right) >> 1;
      const child = childNodes[middle];

      if(
        locStart(child) - locStart(comment) <= 0 &&
        locEnd(comment) - locEnd(child) <= 0
      ) {
        // The comment is completely contained by this child node.
        comment.enclosingNode = child;

        Comments.decorateComment(child, comment, text, options);
        return; // Abandon the binary search at this level.
      }

      if(locEnd(child) - locStart(comment) <= 0) {
        // This child node falls completely before the comment.
        // Because we will never consider this node or any nodes
        // before it again, this node must be the closest preceding
        // node we have encountered so far.
        precedingNode = child;
        left = middle + 1;
        continue;
      }

      if(locEnd(comment) - locStart(child) <= 0) {
        // This child node falls completely after the comment.
        // Because we will never consider this node or any nodes after
        // it again, this node must be the closest following node we
        // have encountered so far.
        followingNode = child;
        right = middle;
        continue;
      }

      /* istanbul ignore next */
      throw new Error('Comment location overlaps with node location');
    }

    // We don't want comments inside of different expressions inside of the same
    // template literal to move to another expression.
    if(
      comment.enclosingNode &&
      comment.enclosingNode.type === 'TemplateLiteral'
    ) {
      const {quasis} = comment.enclosingNode;
      const commentIndex = Comments.findExpressionIndexForComment(quasis, comment, options);

      if(
        precedingNode &&
        Comments.findExpressionIndexForComment(quasis, precedingNode, options) !==
        commentIndex
      ) {
        precedingNode = null;
      }
      if(
        followingNode &&
        Comments.findExpressionIndexForComment(quasis, followingNode, options) !==
        commentIndex
      ) {
        followingNode = null;
      }
    }

    if(precedingNode) {
      comment.precedingNode = precedingNode;
    }

    if(followingNode) {
      comment.followingNode = followingNode;
    }
  }

  static attach(comments, ast, text, options) {
    if(!Array.isArray(comments)) {
      return;
    }

    const tiesToBreak = [];
    const {locStart} = options;
    const {locEnd} = options;

    comments.forEach((comment, index) => {
      if(options.parser === 'json' && locStart(comment) - locStart(ast) <= 0) {
        Util.addLeadingComment(ast, comment);
        return;
      }

      Comments.decorateComment(ast, comment, text, options);

      const {precedingNode} = comment;
      const {enclosingNode} = comment;
      const {followingNode} = comment;

      const pluginHandleOwnLineComment =
        options.printer.handleComments && options.printer.handleComments.ownLine
          ? options.printer.handleComments.ownLine
          : () => false;
      const pluginHandleEndOfLineComment =
        options.printer.handleComments && options.printer.handleComments.endOfLine
          ? options.printer.handleComments.endOfLine
          : () => false;
      const pluginHandleRemainingComment =
        options.printer.handleComments && options.printer.handleComments.remaining
          ? options.printer.handleComments.remaining
          : () => false;

      const isLastComment = comments.length - 1 === index;

      if(Util.hasNewline(text, locStart(comment), {backwards: true})) {
        // If a comment exists on its own line, prefer a leading comment.
        // We also need to check if it's the first line of the file.
        if(
          pluginHandleOwnLineComment(comment, text, options, ast, isLastComment)
        ) {
          // We're good
        } else if(followingNode) {
          // Always a leading comment.
          Util.addLeadingComment(followingNode, comment);
        } else if(precedingNode) {
          Util.addTrailingComment(precedingNode, comment);
        } else if(enclosingNode) {
          Util.addDanglingComment(enclosingNode, comment);
        } else {
          // There are no nodes, let's attach it to the root of the ast
          /* istanbul ignore next */
          Util.addDanglingComment(ast, comment);
        }
      } else if(Util.hasNewline(text, locEnd(comment))) {
        if(
          pluginHandleEndOfLineComment(comment, text, options, ast, isLastComment)
        ) {
          // We're good
        } else if(precedingNode) {
          // There is content before this comment on the same line, but
          // none after it, so prefer a trailing comment of the previous node.
          Util.addTrailingComment(precedingNode, comment);
        } else if(followingNode) {
          Util.addLeadingComment(followingNode, comment);
        } else if(enclosingNode) {
          Util.addDanglingComment(enclosingNode, comment);
        } else {
          // There are no nodes, let's attach it to the root of the ast
          /* istanbul ignore next */
          Util.addDanglingComment(ast, comment);
        }
      } else {
        if(
          pluginHandleRemainingComment(comment, text, options, ast, isLastComment)
        ) {
          // We're good
        } else if(precedingNode && followingNode) {
          // Otherwise, text exists both before and after the comment on
          // the same line. If there is both a preceding and following
          // node, use a tie-breaking algorithm to determine if it should
          // be attached to the next or previous node. In the last case,
          // simply attach the right node;
          const tieCount = tiesToBreak.length;

          if(tieCount > 0) {
            const lastTie = tiesToBreak[tieCount - 1];
            if(lastTie.followingNode !== comment.followingNode) {
              Comments.breakTies(tiesToBreak, text, options);
            }
          }

          tiesToBreak.push(comment);
        } else if(precedingNode) {
          Util.addTrailingComment(precedingNode, comment);
        } else if(followingNode) {
          Util.addLeadingComment(followingNode, comment);
        } else if(enclosingNode) {
          Util.addDanglingComment(enclosingNode, comment);
        } else {
          // There are no nodes, let's attach it to the root of the ast
          /* istanbul ignore next */
          Util.addDanglingComment(ast, comment);
        }
      }
    });

    Comments.breakTies(tiesToBreak, text, options);

    comments.forEach((comment) => {
      // These node references were useful for breaking ties, but we
      // don't need them anymore, and they create cycles in the AST that
      // may lead to infinite recursion if we don't delete them here.
      delete comment.precedingNode;
      delete comment.enclosingNode;
      delete comment.followingNode;
    });
  }

  static breakTies(tiesToBreak, text, options) {
    const tieCount = tiesToBreak.length;
    if(tieCount === 0) {
      return;
    }

    const {precedingNode} = tiesToBreak[0];
    const {followingNode} = tiesToBreak[0];
    let gapEndPos = options.locStart(followingNode);

    // Iterate backwards through tiesToBreak, examining the gaps
    // between the tied comments. In order to qualify as leading, a
    // comment must be separated from followingNode by an unbroken series of
    // gaps (or other comments). Gaps should only contain whitespace or open
    // parentheses.
    let indexOfFirstLeadingComment;
    for(
      indexOfFirstLeadingComment = tieCount;
      indexOfFirstLeadingComment > 0;
      --indexOfFirstLeadingComment
    ) {
      const comment = tiesToBreak[indexOfFirstLeadingComment - 1];
      assert.strictEqual(comment.precedingNode, precedingNode);
      assert.strictEqual(comment.followingNode, followingNode);

      const gap = text.slice(options.locEnd(comment), gapEndPos).trim();
      if(gap === '' || /^\(+$/.test(gap)) {
        gapEndPos = options.locStart(comment);
      } else {
        // The gap string contained something other than whitespace or open
        // parentheses.
        break;
      }
    }

    tiesToBreak.forEach((comment, index: number) => {
      if(index < indexOfFirstLeadingComment) {
        Util.addTrailingComment(precedingNode, comment);
      } else {
        Util.addLeadingComment(followingNode, comment);
      }
    });

    tiesToBreak.length = 0;
  }

  static printComment(commentPath, options) {
    const comment = commentPath.getValue();
    comment.printed = true;
    return options.printer.printComment(commentPath, options);
  }

  static findExpressionIndexForComment(quasis, comment, options) {
    const startPos = options.locStart(comment) - 1;

    for(let index: number = 1; index < quasis.length; ++index) {
      if(startPos < Comments.getQuasiRange(quasis[index]).start) {
        return index - 1;
      }
    }

    // We haven't found it, it probably means that some of the locations are off.
    // Let's just return the first one.
    /* istanbul ignore next */
    return 0;
  }

  static getQuasiRange(expr) {
    if(expr.start !== undefined) {
      // Babylon
      return {start: expr.start, end: expr.end};
    }
    // Flow
    return {start: expr.range[0], end: expr.range[1]};
  }

  static printLeadingComment(commentPath, print, options) {
    const comment = commentPath.getValue();
    const contents = Comments.printComment(commentPath, options);
    if(!contents) {
      return '';
    }
    const isBlock = Util.isBlockComment(comment);

    // Leading block comments should see if they need to stay on the
    // same line or not.
    if(isBlock) {
      return DocBuilders.concat([
        contents,
        Util.hasNewline(options.originalText, options.locEnd(comment))
          ? DocBuilders.hardline
          : ' '
      ]);
    }

    return DocBuilders.concat([contents, DocBuilders.hardline]);
  }

  static printTrailingComment(commentPath, print, options) {
    const comment = commentPath.getValue();
    const contents = Comments.printComment(commentPath, options);
    if(!contents) {
      return '';
    }
    const isBlock = Util.isBlockComment(comment);

    // We don't want the line to break
    // when the parentParentNode is a ClassDeclaration/-Expression
    // And the parentNode is in the superClass property
    const parentNode = commentPath.getNode(1);
    const parentParentNode = commentPath.getNode(2);
    const isParentSuperClass =
      parentParentNode &&
      (parentParentNode.type === 'ClassDeclaration' ||
        parentParentNode.type === 'ClassExpression') &&
      parentParentNode.superClass === parentNode;

    if(
      Util.hasNewline(options.originalText, options.locStart(comment), {
        backwards: true
      })
    ) {
      // This allows comments at the end of nested structures:
      // {
      //   x: 1,
      //   y: 2
      //   // A comment
      // }
      // Those kinds of comments are almost always leading comments, but
      // here it doesn't go "outside" the block and turns it into a
      // trailing comment for `2`. We can simulate the above by checking
      // if this a comment on its own line; normal trailing comments are
      // always at the end of another expression.

      const isLineBeforeEmpty = Util.isPreviousLineEmpty(
        options.originalText,
        comment,
        options.locStart
      );

      return DocBuilders.lineSuffix(
        DocBuilders.concat([DocBuilders.hardline, isLineBeforeEmpty ? DocBuilders.hardline : '', contents])
      );
    } else if(isBlock || isParentSuperClass) {
      // Trailing block comments never need a newline
      return DocBuilders.concat([' ', contents]);
    }

    return DocBuilders.concat([DocBuilders.lineSuffix(` ${contents}`), !isBlock ? DocBuilders.breakParent : '']);
  }

  static printDanglingComments(path, options, sameIndent?, filter?) {
    const parts = [];
    const node = path.getValue();

    if(!node || !node.comments) {
      return '';
    }

    path.each((commentPath) => {
      const comment = commentPath.getValue();
      if(
        comment &&
        !comment.leading &&
        !comment.trailing &&
        (!filter || filter(comment))
      ) {
        parts.push(Comments.printComment(commentPath, options));
      }
    }, 'comments');

    if(parts.length === 0) {
      return '';
    }

    if(sameIndent) {
      return DocBuilders.join(DocBuilders.hardline, parts);
    }
    return DocBuilders
      .indent(DocBuilders.concat([DocBuilders.hardline, DocBuilders.join(DocBuilders.hardline, parts)]));
  }

  static prependCursorPlaceholder(path, options, printed) {
    if(path.getNode() === options.cursorNode && path.getValue()) {
      return DocBuilders.concat([DocBuilders.cursor, printed]);
    }
    return printed;
  }

  static printComments(path, print, options, needsSemi: boolean = false) {
    const value = path.getValue();
    const printed = print(path);
    const comments = value && value.comments;

    if(!comments || comments.length === 0) {
      return Comments.prependCursorPlaceholder(path, options, printed);
    }

    const leadingParts = [];
    const trailingParts = [needsSemi ? ';' : '', printed];

    path.each((commentPath) => {
      const comment = commentPath.getValue();
      const {leading} = comment;
      const {trailing} = comment;

      if(leading) {
        const contents = Comments.printLeadingComment(commentPath, print, options);
        if(!contents) {
          return;
        }
        leadingParts.push(contents);

        const text = options.originalText;
        if(Util.hasNewline(text, Util.skipNewline(text, options.locEnd(comment)))) {
          leadingParts.push(DocBuilders.hardline);
        }
      } else if(trailing) {
        trailingParts.push(Comments.printTrailingComment(commentPath, print, options));
      }
    }, 'comments');

    return Comments.prependCursorPlaceholder(path, options, DocBuilders.concat(leadingParts.concat(trailingParts)));
  }
}
