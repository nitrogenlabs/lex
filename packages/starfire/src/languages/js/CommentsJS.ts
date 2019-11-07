import {SFLanguageOptionsType} from 'types/options';

import {Util} from '../../common/Util';

export class CommentsJS {
  static handleOwnLineComment(comment, text, options, ast, isLastComment) {
    const {precedingNode} = comment;
    const {enclosingNode} = comment;
    const {followingNode} = comment;
    if(
      CommentsJS.handleLastFunctionArgComments(
        text,
        precedingNode,
        enclosingNode,
        followingNode,
        comment,
        options
      ) ||
      CommentsJS.handleMemberExpressionComments(enclosingNode, followingNode, comment) ||
      CommentsJS.handleIfStatementComments(
        text,
        precedingNode,
        enclosingNode,
        followingNode,
        comment,
        options
      ) ||
      CommentsJS.handleTryStatementComments(enclosingNode, followingNode, comment) ||
      CommentsJS.handleClassComments(enclosingNode, precedingNode, followingNode, comment) ||
      CommentsJS.handleImportSpecifierComments(enclosingNode, comment) ||
      CommentsJS.handleForComments(enclosingNode, precedingNode, comment) ||
      CommentsJS.handleUnionTypeComments(
        precedingNode,
        enclosingNode,
        followingNode,
        comment
      ) ||
      CommentsJS.handleOnlyComments(enclosingNode, ast, comment, isLastComment) ||
      CommentsJS.handleImportDeclarationComments(
        text,
        enclosingNode,
        precedingNode,
        comment,
        options
      ) ||
      CommentsJS.handleAssignmentPatternComments(enclosingNode, comment) ||
      CommentsJS.handleMethodNameComments(
        text,
        enclosingNode,
        precedingNode,
        comment,
        options
      )
    ) {
      return true;
    }
    return false;
  }

  static handleEndOfLineComment(comment, text, options, ast, isLastComment) {
    const {enclosingNode, followingNode, precedingNode} = comment;

    if(
      CommentsJS.handleLastFunctionArgComments(
        text,
        precedingNode,
        enclosingNode,
        followingNode,
        comment,
        options
      ) ||
      CommentsJS.handleConditionalExpressionComments(
        enclosingNode,
        precedingNode,
        followingNode,
        comment,
        text,
        options
      ) ||
      CommentsJS.handleImportSpecifierComments(enclosingNode, comment) ||
      CommentsJS.handleIfStatementComments(
        text,
        precedingNode,
        enclosingNode,
        followingNode,
        comment,
        options
      ) ||
      CommentsJS.handleClassComments(enclosingNode, precedingNode, followingNode, comment) ||
      CommentsJS.handleLabeledStatementComments(enclosingNode, comment) ||
      CommentsJS.handleCallExpressionComments(precedingNode, enclosingNode, comment) ||
      CommentsJS.handlePropertyComments(enclosingNode, comment) ||
      CommentsJS.handleExportNamedDeclarationComments(enclosingNode, comment) ||
      CommentsJS.handleOnlyComments(enclosingNode, ast, comment, isLastComment) ||
      CommentsJS.handleTypeAliasComments(enclosingNode, followingNode, comment) ||
      CommentsJS.handleVariableDeclaratorComments(enclosingNode, followingNode, comment)
    ) {
      return true;
    }

    return false;
  }

  static handleRemainingComment(comment, text, options, ast, isLastComment) {
    const {enclosingNode, followingNode, precedingNode} = comment;

    if(
      CommentsJS.handleIfStatementComments(
        text,
        precedingNode,
        enclosingNode,
        followingNode,
        comment,
        options
      ) ||
      CommentsJS.handleObjectPropertyAssignment(enclosingNode, precedingNode, comment) ||
      CommentsJS.handleCommentInEmptyParens(text, enclosingNode, comment, options) ||
      CommentsJS.handleMethodNameComments(
        text,
        enclosingNode,
        precedingNode,
        comment,
        options
      ) ||
      CommentsJS.handleOnlyComments(enclosingNode, ast, comment, isLastComment) ||
      CommentsJS.handleCommentAfterArrowParams(text, enclosingNode, comment, options) ||
      CommentsJS.handleFunctionNameComments(
        text,
        enclosingNode,
        precedingNode,
        comment,
        options
      )
    ) {
      return true;
    }
    return false;
  }

  static addBlockStatementFirstComment(node, comment) {
    const body = node.body.filter((n) => n.type !== 'EmptyStatement');

    if(body.length === 0) {
      Util.addDanglingComment(node, comment);
    } else {
      Util.addLeadingComment(body[0], comment);
    }
  }

  static addBlockOrNotComment(node, comment) {
    if(node.type === 'BlockStatement') {
      CommentsJS.addBlockStatementFirstComment(node, comment);
    } else {
      Util.addLeadingComment(node, comment);
    }
  }

  // There are often comments before the else clause of if statements like
  //
  //   if (1) { ... }
  //   // comment
  //   else { ... }
  //
  // They are being attached as leading comments of the BlockExpression which
  // is not well printed. What we want is to instead move the comment inside
  // of the block and make it leadingComment of the first element of the block
  // or dangling comment of the block if there is nothing inside
  //
  //   if (1) { ... }
  //   else {
  //     // comment
  //     ...
  //   }
  static handleIfStatementComments(
    text,
    precedingNode,
    enclosingNode,
    followingNode,
    comment,
    options
  ) {
    if(
      !enclosingNode ||
      enclosingNode.type !== 'IfStatement' ||
      !followingNode
    ) {
      return false;
    }

    // We unfortunately have no way using the AST or location of nodes to know
    // if the comment is positioned before the condition parenthesis:
    //   if (a /* comment */) {}
    // The only workaround I found is to look at the next character to see if
    // it is a ).
    const nextCharacter = Util.getNextNonSpaceNonCommentCharacter(text, comment, options.locEnd);

    if(nextCharacter === ')') {
      Util.addTrailingComment(precedingNode, comment);
      return true;
    }

    if(followingNode.type === 'BlockStatement') {
      CommentsJS.addBlockStatementFirstComment(followingNode, comment);
      return true;
    }

    if(followingNode.type === 'IfStatement') {
      CommentsJS.addBlockOrNotComment(followingNode.consequent, comment);
      return true;
    }

    // For comments positioned after the condition parenthesis in an if statement
    // before the consequent with or without brackets on, such as
    // if (a) /* comment */ {} or if (a) /* comment */ true,
    // we look at the next character to see if it is a { or if the following node
    // is the consequent for the if statement
    if(nextCharacter === '{' || enclosingNode.consequent === followingNode) {
      Util.addLeadingComment(followingNode, comment);
      return true;
    }

    return false;
  }

  // Same as IfStatement but for TryStatement
  static handleTryStatementComments(enclosingNode, followingNode, comment) {
    if(
      !enclosingNode ||
      enclosingNode.type !== 'TryStatement' ||
      !followingNode
    ) {
      return false;
    }

    if(followingNode.type === 'BlockStatement') {
      CommentsJS.addBlockStatementFirstComment(followingNode, comment);
      return true;
    }

    if(followingNode.type === 'TryStatement') {
      CommentsJS.addBlockOrNotComment(followingNode.finalizer, comment);
      return true;
    }

    if(followingNode.type === 'CatchClause') {
      CommentsJS.addBlockOrNotComment(followingNode.body, comment);
      return true;
    }

    return false;
  }

  static handleMemberExpressionComments(enclosingNode, followingNode, comment) {
    if(
      enclosingNode &&
      enclosingNode.type === 'MemberExpression' &&
      followingNode &&
      followingNode.type === 'Identifier'
    ) {
      Util.addLeadingComment(enclosingNode, comment);
      return true;
    }

    return false;
  }

  static handleConditionalExpressionComments(
    enclosingNode,
    precedingNode,
    followingNode,
    comment,
    text,
    options
  ) {
    const isSameLineAsPrecedingNode =
      precedingNode && !Util.hasNewlineInRange(text, options.locEnd(precedingNode), options.locStart(comment));

    if(
      (!precedingNode || !isSameLineAsPrecedingNode) &&
      enclosingNode &&
      enclosingNode.type === 'ConditionalExpression' &&
      followingNode
    ) {
      Util.addLeadingComment(followingNode, comment);
      return true;
    }
    return false;
  }

  static handleObjectPropertyAssignment(enclosingNode, precedingNode, comment) {
    if(
      enclosingNode &&
      (enclosingNode.type === 'ObjectProperty' ||
        enclosingNode.type === 'Property') &&
      enclosingNode.shorthand &&
      enclosingNode.key === precedingNode &&
      enclosingNode.value.type === 'AssignmentPattern'
    ) {
      Util.addTrailingComment(enclosingNode.value.left, comment);
      return true;
    }
    return false;
  }

  static handleClassComments(
    enclosingNode,
    precedingNode,
    followingNode,
    comment
  ) {
    if(
      enclosingNode &&
      (enclosingNode.type === 'ClassDeclaration' ||
        enclosingNode.type === 'ClassExpression') &&
      (enclosingNode.decorators && enclosingNode.decorators.length > 0) &&
      !(followingNode && followingNode.type === 'Decorator')
    ) {
      if(!enclosingNode.decorators || enclosingNode.decorators.length === 0) {
        Util.addLeadingComment(enclosingNode, comment);
      } else {
        Util.addTrailingComment(
          enclosingNode.decorators[enclosingNode.decorators.length - 1],
          comment
        );
      }
      return true;
    }
    return false;
  }

  static handleMethodNameComments(text, enclosingNode, precedingNode, comment, options) {
    // This is only needed for estree parsers (flow, typescript) to attach
    // after a method name:
    // obj = { fn /*comment*/() {} };
    if(
      enclosingNode &&
      precedingNode &&
      (enclosingNode.type === 'Property' ||
        enclosingNode.type === 'MethodDefinition') &&
      precedingNode.type === 'Identifier' &&
      enclosingNode.key === precedingNode &&
      // special Property case: { key: /*comment*/(value) };
      // comment should be attached to value instead of key
      Util.getNextNonSpaceNonCommentCharacter(text, precedingNode, options.locEnd) !== ':'
    ) {
      Util.addTrailingComment(precedingNode, comment);
      return true;
    }

    // Print comments between decorators and class methods as a trailing comment
    // on the decorator node instead of the method node
    if(
      precedingNode &&
      enclosingNode &&
      precedingNode.type === 'Decorator' &&
      (enclosingNode.type === 'ClassMethod' ||
        enclosingNode.type === 'ClassProperty' ||
        enclosingNode.type === 'TSAbstractClassProperty' ||
        enclosingNode.type === 'TSAbstractMethodDefinition' ||
        enclosingNode.type === 'MethodDefinition')
    ) {
      Util.addTrailingComment(precedingNode, comment);
      return true;
    }

    return false;
  }

  static handleFunctionNameComments(text, enclosingNode, precedingNode, comment, options) {
    if(Util.getNextNonSpaceNonCommentCharacter(text, comment, options.locEnd) !== '(') {
      return false;
    }

    if(
      precedingNode &&
      enclosingNode &&
      (enclosingNode.type === 'FunctionDeclaration' ||
        enclosingNode.type === 'FunctionExpression' ||
        enclosingNode.type === 'ClassMethod' ||
        enclosingNode.type === 'MethodDefinition' ||
        enclosingNode.type === 'ObjectMethod')
    ) {
      Util.addTrailingComment(precedingNode, comment);
      return true;
    }

    return false;
  }

  static handleCommentAfterArrowParams(text, enclosingNode, comment, options: SFLanguageOptionsType) {
    if(!(enclosingNode && enclosingNode.type === 'ArrowFunctionExpression')) {
      return false;
    }

    const {locEnd} = options;
    const index = Util.getNextNonSpaceNonCommentCharacterIndex(text, comment, locEnd);

    if(text.substr(index, 2) === '=>') {
      Util.addDanglingComment(enclosingNode, comment);
      return true;
    }

    return false;
  }

  static handleCommentInEmptyParens(text, enclosingNode, comment, options) {
    if(Util.getNextNonSpaceNonCommentCharacter(text, comment, options.locEnd) !== ')') {
      return false;
    }

    // Only add dangling comments to fix the case when no params are present,
    // i.e. a function without any argument.
    if(
      enclosingNode &&
      (((enclosingNode.type === 'FunctionDeclaration' ||
        enclosingNode.type === 'FunctionExpression' ||
        (enclosingNode.type === 'ArrowFunctionExpression' &&
          (enclosingNode.body.type !== 'CallExpression' ||
            enclosingNode.body.arguments.length === 0)) ||
        enclosingNode.type === 'ClassMethod' ||
        enclosingNode.type === 'ObjectMethod') &&
        enclosingNode.params.length === 0) ||
        (enclosingNode.type === 'CallExpression' &&
          enclosingNode.arguments.length === 0))
    ) {
      Util.addDanglingComment(enclosingNode, comment);
      return true;
    }

    if(
      enclosingNode &&
      (enclosingNode.type === 'MethodDefinition' &&
        enclosingNode.value.params.length === 0)
    ) {
      Util.addDanglingComment(enclosingNode.value, comment);
      return true;
    }

    return false;
  }

  static handleLastFunctionArgComments(text, precedingNode, enclosingNode, followingNode, comment, options) {
    // Type definitions functions
    if(
      precedingNode &&
      precedingNode.type === 'FunctionTypeParam' &&
      enclosingNode &&
      enclosingNode.type === 'FunctionTypeAnnotation' &&
      followingNode &&
      followingNode.type !== 'FunctionTypeParam'
    ) {
      Util.addTrailingComment(precedingNode, comment);
      return true;
    }

    // Real functions
    if(
      precedingNode &&
      (precedingNode.type === 'Identifier' ||
        precedingNode.type === 'AssignmentPattern') &&
      enclosingNode &&
      (enclosingNode.type === 'ArrowFunctionExpression' ||
        enclosingNode.type === 'FunctionExpression' ||
        enclosingNode.type === 'FunctionDeclaration' ||
        enclosingNode.type === 'ObjectMethod' ||
        enclosingNode.type === 'ClassMethod') &&
      Util.getNextNonSpaceNonCommentCharacter(
        text,
        comment,
        options.locEnd
      ) === ')'
    ) {
      Util.addTrailingComment(precedingNode, comment);
      return true;
    }
    return false;
  }

  static handleImportSpecifierComments(enclosingNode, comment) {
    if(enclosingNode && enclosingNode.type === 'ImportSpecifier') {
      Util.addLeadingComment(enclosingNode, comment);
      return true;
    }
    return false;
  }

  static handleLabeledStatementComments(enclosingNode, comment) {
    if(enclosingNode && enclosingNode.type === 'LabeledStatement') {
      Util.addLeadingComment(enclosingNode, comment);
      return true;
    }
    return false;
  }

  static handleCallExpressionComments(precedingNode, enclosingNode, comment) {
    if(
      enclosingNode &&
      enclosingNode.type === 'CallExpression' &&
      precedingNode &&
      enclosingNode.callee === precedingNode &&
      enclosingNode.arguments.length > 0
    ) {
      Util.addLeadingComment(enclosingNode.arguments[0], comment);
      return true;
    }
    return false;
  }

  static handleUnionTypeComments(precedingNode, enclosingNode, followingNode, comment) {
    if(
      enclosingNode &&
      (enclosingNode.type === 'UnionTypeAnnotation' ||
        enclosingNode.type === 'TSUnionType')
    ) {
      Util.addTrailingComment(precedingNode, comment);
      return true;
    }
    return false;
  }

  static handlePropertyComments(enclosingNode, comment) {
    if(
      enclosingNode &&
      (enclosingNode.type === 'Property' ||
        enclosingNode.type === 'ObjectProperty')
    ) {
      Util.addLeadingComment(enclosingNode, comment);
      return true;
    }
    return false;
  }

  static handleExportNamedDeclarationComments(enclosingNode, comment) {
    if(enclosingNode && enclosingNode.type === 'ExportNamedDeclaration') {
      Util.addLeadingComment(enclosingNode, comment);
      return true;
    }
    return false;
  }

  static handleOnlyComments(enclosingNode, ast, comment, isLastComment) {
    // With Flow the enclosingNode is undefined so use the AST instead.
    if(ast && ast.body && ast.body.length === 0) {
      if(isLastComment) {
        Util.addDanglingComment(ast, comment);
      } else {
        Util.addLeadingComment(ast, comment);
      }
      return true;
    } else if(
      enclosingNode &&
      enclosingNode.type === 'Program' &&
      enclosingNode.body.length === 0 &&
      enclosingNode.directives &&
      enclosingNode.directives.length === 0
    ) {
      if(isLastComment) {
        Util.addDanglingComment(enclosingNode, comment);
      } else {
        Util.addLeadingComment(enclosingNode, comment);
      }
      return true;
    }
    return false;
  }

  static handleForComments(enclosingNode, precedingNode, comment) {
    if(
      enclosingNode &&
      (enclosingNode.type === 'ForInStatement' ||
        enclosingNode.type === 'ForOfStatement')
    ) {
      Util.addLeadingComment(enclosingNode, comment);
      return true;
    }

    return false;
  }

  static handleImportDeclarationComments(text, enclosingNode, precedingNode, comment, options) {
    if(
      precedingNode &&
      enclosingNode &&
      enclosingNode.type === 'ImportDeclaration' &&
      Util.hasNewline(text, options.locEnd(comment))
    ) {
      Util.addTrailingComment(precedingNode, comment);
      return true;
    }

    return false;
  }

  static handleAssignmentPatternComments(enclosingNode, comment) {
    if(enclosingNode && enclosingNode.type === 'AssignmentPattern') {
      Util.addLeadingComment(enclosingNode, comment);
      return true;
    }

    return false;
  }

  static handleTypeAliasComments(enclosingNode, followingNode, comment) {
    if(enclosingNode && enclosingNode.type === 'TypeAlias') {
      Util.addLeadingComment(enclosingNode, comment);
      return true;
    }

    return false;
  }

  static handleVariableDeclaratorComments(enclosingNode, followingNode, comment) {
    if(
      enclosingNode &&
      enclosingNode.type === 'VariableDeclarator' &&
      followingNode &&
      (followingNode.type === 'ObjectExpression' ||
        followingNode.type === 'ArrayExpression')
    ) {
      Util.addLeadingComment(followingNode, comment);
      return true;
    }

    return false;
  }
}
