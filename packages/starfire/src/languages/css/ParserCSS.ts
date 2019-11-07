import grayMatter from 'gray-matter';

import {ParserError} from '../../common/errors/ParserError';

export class ParserCSS {
  static parseSelector(selector) {
    // If there's a comment inside of a selector, the parser tries to parse
    // the content of the comment as selectors which turns it into complete
    // garbage. Better to print the whole selector as-is and not try to parse
    // and reformat it.
    if(selector.match(/\/\/|\/\*/)) {
      return {
        type: 'selector-comment',
        value: selector.replace(/^ +/, '').replace(/ +$/, '')
      };
    }
    const selectorParser = require('postcss-selector-parser');
    let result;
    selectorParser((selectedResult) => {
      result = selectedResult;
    }).process(selector);
    return ParserCSS.addTypePrefix(result, 'selector-');
  }

  static parseValueNodes(nodes) {
    let parenGroup = {
      close: null,
      groups: [],
      open: null,
      type: 'paren_group'
    };
    const parenGroupStack = [parenGroup];
    const rootParenGroup = parenGroup;
    let commaGroup = {
      groups: [],
      type: 'comma_group'
    };
    const commaGroupStack = [commaGroup];

    nodes.forEach((node) => {
      const isUnquotedDataURLCall =
        node.type === 'func' &&
        node.value === 'url' &&
        node.group &&
        node.group.groups &&
        node.group.groups[0] &&
        node.group.groups[0].groups &&
        node.group.groups[0].groups.length > 2 &&
        node.group.groups[0].groups[0].type === 'word' &&
        node.group.groups[0].groups[0].value === 'data' &&
        node.group.groups[0].groups[1].type === 'colon' &&
        node.group.groups[0].groups[1].value === ':';

      if(isUnquotedDataURLCall) {
        node.group.groups = [ParserCSS.stringifyGroup(node)];

        return node;
      }

      if(node.type === 'paren' && node.value === '(') {
        parenGroup = {
          close: null,
          groups: [],
          open: node,
          type: 'paren_group'
        };
        parenGroupStack.push(parenGroup);

        commaGroup = {
          groups: [],
          type: 'comma_group'
        };
        commaGroupStack.push(commaGroup);
      } else if(node.type === 'paren' && node.value === ')') {
        if(commaGroup.groups.length) {
          parenGroup.groups.push(commaGroup);
        }
        parenGroup.close = node;

        if(commaGroupStack.length === 1) {
          throw new Error('Unbalanced parenthesis');
        }

        commaGroupStack.pop();
        commaGroup = commaGroupStack[commaGroupStack.length - 1];
        commaGroup.groups.push(parenGroup);

        parenGroupStack.pop();
        parenGroup = parenGroupStack[parenGroupStack.length - 1];
      } else if(node.type === 'comma') {
        parenGroup.groups.push(commaGroup);
        commaGroup = {
          groups: [],
          type: 'comma_group'
        };
        commaGroupStack[commaGroupStack.length - 1] = commaGroup;
      } else {
        commaGroup.groups.push(node);
      }
    });

    if(commaGroup.groups.length > 0) {
      parenGroup.groups.push(commaGroup);
    }

    return rootParenGroup;
  }

  static stringifyGroup(node) {
    if(node.group) {
      return ParserCSS.stringifyGroup(node.group);
    }

    if(node.groups) {
      return node.groups.reduce((previousValue, currentValue, index) => (
        previousValue +
          ParserCSS.stringifyGroup(currentValue) +
          (currentValue.type === 'comma_group' && index !== node.groups.length - 1
            ? ','
            : '')
      ), '');
    }

    const before = node.raws && node.raws.before ? node.raws.before : '';
    const value = node.value ? node.value : '';
    const unit = node.unit ? node.unit : '';
    const after = node.raws && node.raws.after ? node.raws.after : '';

    return before + value + unit + after;
  }

  static flattenGroups(node) {
    if(
      node.type === 'paren_group' &&
      !node.open &&
      !node.close &&
      node.groups.length === 1
    ) {
      return ParserCSS.flattenGroups(node.groups[0]);
    }

    if(node.type === 'comma_group' && node.groups.length === 1) {
      return ParserCSS.flattenGroups(node.groups[0]);
    }

    if(node.type === 'paren_group' || node.type === 'comma_group') {
      return {...node, groups: node.groups.map(ParserCSS.flattenGroups)};
    }

    return node;
  }

  static addTypePrefix(node, prefix) {
    if(node && typeof node === 'object') {
      delete node.parent;

      Object.keys(node).forEach((key) => {
        ParserCSS.addTypePrefix(node[key], prefix);

        if(key === 'type' && typeof node[key] === 'string') {
          if(!node[key].startsWith(prefix)) {
            node[key] = prefix + node[key];
          }
        }
      });
    }

    return node;
  }

  static addMissingType(node) {
    if(node && typeof node === 'object') {
      delete node.parent;

      Object.keys(node).forEach((key) => {
        ParserCSS.addMissingType(node[key]);
      });

      if(!Array.isArray(node) && node.value && !node.type) {
        node.type = 'unknown';
      }
    }
    return node;
  }

  static parseNestedValue(node) {
    if(node && typeof node === 'object') {
      delete node.parent;
      Object.keys(node).forEach((key) => {
        ParserCSS.parseNestedValue(node[key]);

        if(key === 'nodes') {
          node.group = ParserCSS.flattenGroups(ParserCSS.parseValueNodes(node[key]));
          delete node[key];
        }
      });
    }
    return node;
  }

  static parseValue(value) {
    const valueParser = require('postcss-values-parser');
    const result = valueParser(value, {loose: true}).parse();
    const parsedResult = ParserCSS.parseNestedValue(result);
    return ParserCSS.addTypePrefix(parsedResult, 'value-');
  }

  static parseMediaQuery(value) {
    const mediaParser = require('postcss-media-query-parser').default;
    const result = ParserCSS.addMissingType(mediaParser(value));
    return ParserCSS.addTypePrefix(result, 'media-');
  }

  static DEFAULT_SCSS_DIRECTIVE = /(\s*?)(!default).*$/;
  static GLOBAL_SCSS_DIRECTIVE = /(\s*?)(!global).*$/;

  static parseNestedCSS(node) {
    if(node && typeof node === 'object') {
      delete node.parent;

      Object.keys(node).forEach((key) => {
        ParserCSS.parseNestedCSS(node[key]);
      });

      if(typeof node.selector === 'string' && node.selector.trim().length > 0) {
        let selector = node.raws.selector
          ? node.raws.selector.raw
          : node.selector;

        if(node.raws.between && node.raws.between.trim()) {
          selector += node.raws.between;
        }

        if(selector.startsWith('@') && selector.endsWith(':')) {
          return node;
        }

        try {
          node.selector = ParserCSS.parseSelector(selector);
          node.raws.selector = selector;
        } catch(e) {
          // Fail silently. It's better to print it as is than to try and parse it
          // Note: A common failure is for SCSS nested properties. `background:
          // none { color: red; }` is parsed as a NestedDeclaration by
          // postcss-scss, while `background: { color: red; }` is parsed as a Rule
          // with a selector ending with a colon. See:
          // https://github.com/postcss/postcss-scss/issues/39
          node.selector = {
            type: 'selector-root-invalid',
            value: selector
          };
        }

        return node;
      }

      if(
        node.type &&
        node.type !== 'css-comment-yaml' &&
        typeof node.value === 'string' &&
        node.value.trim().length > 0
      ) {
        try {
          let value = node.raws.value ? node.raws.value.raw : node.value;

          const defaultSCSSDirectiveIndex = value.match(ParserCSS.DEFAULT_SCSS_DIRECTIVE);

          if(defaultSCSSDirectiveIndex) {
            value = value.substring(0, defaultSCSSDirectiveIndex.index);
            node.scssDefault = true;

            if(defaultSCSSDirectiveIndex[0].trim() !== '!default') {
              node.raws.scssDefault = defaultSCSSDirectiveIndex[0];
            }
          }

          const globalSCSSDirectiveIndex = value.match(ParserCSS.GLOBAL_SCSS_DIRECTIVE);

          if(globalSCSSDirectiveIndex) {
            value = value.substring(0, globalSCSSDirectiveIndex.index);
            node.scssGlobal = true;

            if(globalSCSSDirectiveIndex[0].trim() !== '!global') {
              node.raws.scssGlobal = globalSCSSDirectiveIndex[0];
            }
          }

          if(value.startsWith('progid:')) {
            return node;
          }

          node.value = ParserCSS.parseValue(value);
        } catch(e) {
          throw new ParserError(
            `(postcss-values-parser) ${e.toString()}`,
            node.source
          );
        }

        return node;
      }

      if(node.type === 'css-atrule' && typeof node.params === 'string') {
        let params =
          node.raws.params && node.raws.params.raw
            ? node.raws.params.raw
            : node.params;

        if(node.raws.afterName.trim()) {
          params = node.raws.afterName + params;
        }

        if(node.raws.between.trim()) {
          params = params + node.raws.between;
        }

        params = params.trim();

        if(params.length === 0) {
          return node;
        }

        const {name} = node;
        const lowercasedName = node.name.toLowerCase();

        if(name === 'warn' || name === 'error') {
          node.params = {
            type: 'media-unknown',
            value: params
          };

          return node;
        }

        if(name === 'extend' || name === 'nest') {
          node.selector = ParserCSS.parseSelector(params);
          delete node.params;

          return node;
        }

        if(name === 'at-root') {
          if(/^\(\s*(without|with)\s*:[\s\S]+\)$/.test(params)) {
            node.params = ParserCSS.parseMediaQuery(params);
          } else {
            node.selector = ParserCSS.parseSelector(params);
            delete node.params;
          }

          return node;
        }

        if(
          [
            'if',
            'else',
            'for',
            'each',
            'while',
            'debug',
            'mixin',
            'include',
            'function',
            'return',
            'define-mixin',
            'add-mixin'
          ].indexOf(name) !== -1
        ) {
          // Remove unnecessary spaces in SCSS variable arguments
          params = params.replace(/(\$\S+?)\s+?\.\.\./, '$1...');
          // Remove unnecessary spaces before SCSS control, mixin and function directives
          params = params.replace(/^(?!if)(\S+)\s+\(/, '$1(');

          node.value = ParserCSS.parseValue(params);
          delete node.params;

          return node;
        }

        if(name === 'custom-selector') {
          const customSelector = params.match(/:--\S+?\s+/)[0].trim();

          node.customSelector = customSelector;
          node.selector = ParserCSS.parseSelector(params.substring(customSelector.length));
          delete node.params;

          return node;
        }

        if(
          ['namespace', 'import', 'media', 'supports', 'custom-media'].indexOf(
            lowercasedName
          ) !== -1
        ) {
          if(params.includes('#{')) {
            // Workaround for media at rule with scss interpolation
            return {
              type: 'media-unknown',
              value: params
            };
          }

          node.params = ParserCSS.parseMediaQuery(params);

          return node;
        }

        node.params = params;

        return node;
      }
    }

    return node;
  }

  static parseWithParser(parser, text, frontMatter) {
    let result;
    try {
      result = parser.parse(text);
    } catch(e) {
      if(typeof e.line !== 'number') {
        throw e;
      }
      throw new ParserError(`(css) ${e.name} ${e.reason}`, {start: e});
    }

    if(Object.keys(frontMatter.data).length > 0) {
      result.nodes.unshift({
        type: 'comment-yaml',
        value: grayMatter.stringify('', frontMatter.data).replace(/\s$/, '')
      });
    }

    const prefixedResult = ParserCSS.addTypePrefix(result, 'css-');
    const parsedResult = ParserCSS.parseNestedCSS(prefixedResult);
    return parsedResult;
  }

  static requireParser(isSCSS) {
    if(isSCSS) {
      return require('postcss-scss');
    }

    // TODO: Remove this hack when this issue is fixed:
    // https://github.com/shellscape/postcss-less/issues/88
    const LessParser = require('postcss-less/dist/less-parser');
    LessParser.prototype.atrule = function() {
      return Object.getPrototypeOf(LessParser.prototype).atrule.apply(this, arguments);
    };

    return require('postcss-less');
  }

  static IS_POSSIBLY_SCSS = /(\w\s*: [^}:]+|#){|@import[^\n]+(url|,)/;

  static parse(text, parsers, opts) {
    const hasExplicitParserChoice =
      opts.parser === 'less' || opts.parser === 'scss';

    const isSCSS = hasExplicitParserChoice
      ? opts.parser === 'scss'
      : ParserCSS.IS_POSSIBLY_SCSS.test(text);

    const frontMatter = grayMatter(text);
    const normalizedText = frontMatter.content;

    try {
      return ParserCSS.parseWithParser(ParserCSS.requireParser(isSCSS), normalizedText, frontMatter);
    } catch(originalError) {
      if(hasExplicitParserChoice) {
        throw originalError;
      }

      try {
        return ParserCSS.parseWithParser(
          ParserCSS.requireParser(!isSCSS),
          normalizedText,
          frontMatter
        );
      } catch(secondError) {
        throw originalError;
      }
    }
  }
}
