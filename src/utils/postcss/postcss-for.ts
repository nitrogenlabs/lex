/**
 * Copyright (c) 2025-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 *
 * PostCSS 8-compatible version of postcss-for plugin
 * Original: https://github.com/antyakushev/postcss-for
 */
import postcss from 'postcss';
import postcssSimpleVars from 'postcss-simple-vars';

interface PostcssForOptions {
  nested?: boolean;
}

const postcssFor = (opts: PostcssForOptions = {}) => {
  const options = {
    nested: opts.nested !== false
  };

  const iterStack: string[] = [];

  const parentsHaveIterator = (rule: postcss.AtRule, param: string): boolean => {
    if (rule.parent == null) {
      return false;
    }
    if (rule.parent.type === 'root') {
      return false;
    }
    if (rule.parent.type !== 'atrule' || !rule.parent.params) {
      return false;
    }

    const parentIterVar = rule.parent.params.split(/\s+/)[0];
    if (!parentIterVar) {
      return false;
    }
    if (parentIterVar === param) {
      return true;
    }
    if (iterStack.indexOf(param) !== -1) {
      return true;
    }
    return parentsHaveIterator(rule.parent as postcss.AtRule, param);
  };

  const manageIterStack = (rule: postcss.AtRule) => {
    if (rule.parent && rule.parent.type !== 'root') {
      const parentIterVar = rule.parent.type === 'atrule' && rule.parent.params
        ? rule.parent.params.split(/\s+/)[0]
        : null;
      if (parentIterVar && iterStack.indexOf(parentIterVar) === -1) {
        iterStack.splice(0, iterStack.length);
      } else if (parentIterVar) {
        const parentIndex = iterStack.indexOf(parentIterVar);
        if (parentIndex !== -1) {
          iterStack.splice(parentIndex + 1, iterStack.length - parentIndex - 1);
        }
      }
    } else {
      iterStack.splice(0, iterStack.length);
    }
    const currentIterVar = rule.params.split(/\s+/)[0];
    if (currentIterVar) {
      iterStack.push(currentIterVar);
    }
  };

  const checkNumber = (rule: postcss.AtRule) => {
    return (param: string) => {
      if (isNaN(parseInt(param, 10)) || !param.match(/^-?\d+\.?\d*$/)) {
        if (param.indexOf('$') !== -1) {
          if (!parentsHaveIterator(rule, param)) {
            throw rule.error('External variable (not from a parent for loop) cannot be used as a range parameter', {
              plugin: 'postcss-for'
            });
          }
        } else {
          throw rule.error('Range parameter should be a number', {
            plugin: 'postcss-for'
          });
        }
      }
    };
  };

  const checkParams = (rule: postcss.AtRule, params: string[]) => {
    if (
      !params[0]?.match(/(^|[^\w])\$([\w\d-_]+)/) ||
      params[1] !== 'from' ||
      params[3] !== 'to' ||
      (params[5] !== 'by' && params[5] !== undefined)
    ) {
      throw rule.error('Wrong loop syntax', {
        plugin: 'postcss-for'
      });
    }

    [params[2], params[4], params[6] || '0'].forEach(checkNumber(rule));
  };

  const unrollLoop = (rule: postcss.AtRule) => {
    const params = rule.params.split(/\s+/);

    checkParams(rule, params);

    const iterator = params[0].slice(1);
    const index = +params[2];
    const top = +params[4];
    const dir = top < index ? -1 : 1;
    const by = (+(params[6] || 1)) * dir;

    const value: Record<string, number> = {};
    for (let i = index; i * dir <= top * dir; i = i + by) {
      const content = rule.clone();
      value[iterator] = i;
      postcssSimpleVars({only: value})(content);
      if (options.nested) {
        processLoops(content);
      }
      if (rule.parent) {
        rule.parent.insertBefore(rule, content.nodes);
      }
    }
    if (rule.parent) {
      rule.remove();
    }
  };

  const processLoops = (css: postcss.Container) => {
    css.walkAtRules((rule) => {
      if (rule.name === 'for') {
        unrollLoop(rule);
      }
    });
  };

  const processOriginalLoops = (css: postcss.Root) => {
    css.walkAtRules((rule) => {
      if (rule.name === 'for') {
        if (rule.parent) {
          manageIterStack(rule);
        }
        unrollLoop(rule);
      }
    });
  };

  return {
    postcssPlugin: 'postcss-for',
    Once(root) {
      processOriginalLoops(root);
    }
  };
};

postcssFor.postcss = true;

export default postcssFor;

