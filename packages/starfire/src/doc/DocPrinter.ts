import {Util} from '../common/Util';
import {DocBuilders} from './DocBuilders';

export class DocPrinter {
  static MODE_BREAK: number = 1;
  static MODE_FLAT: number = 2;

  static rootIndent() {
    return {length: 0, queue: [], value: ''};
  }

  static makeIndent(ind, options) {
    return DocPrinter.generateInd(ind, {type: 'indent'}, options);
  }

  static makeAlign(ind, n, options) {
    return n === -Infinity
      ? ind.root || DocPrinter.rootIndent()
      : n < 0
        ? DocPrinter.generateInd(ind, {type: 'dedent'}, options)
        : !n
          ? ind
          : n.type === 'root'
            ? {...ind, root: ind}
            : typeof n === 'string'
              ? DocPrinter.generateInd(ind, {type: 'stringAlign', n}, options)
              : DocPrinter.generateInd(ind, {type: 'numberAlign', n}, options);
  }

  static generateInd(ind, newPart, options) {
    const queue = newPart.type === 'dedent' ? ind.queue.slice(0, -1) : ind.queue.concat(newPart);
    let value: string = '';
    let length: number = 0;
    let lastTabs: number = 0;
    let lastSpaces: number = 0;
    const addTabs = (count) => {
      value += '\t'.repeat(count);
      length += options.tabWidth * count;
    };
    const addSpaces = (count) => {
      value += ' '.repeat(count);
      length += count;
    };
    const flush = () => {
      if(options.useTabs) {
        flushTabs();
      } else {
        flushSpaces();
      }
    };
    const flushTabs = () => {
      if(lastTabs > 0) {
        addTabs(lastTabs);
      }

      resetLast();
    };
    const flushSpaces = () => {
      if(lastSpaces > 0) {
        addSpaces(lastSpaces);
      }

      resetLast();
    };
    const resetLast = () => {
      lastTabs = 0;
      lastSpaces = 0;
    };

    queue.forEach((part) => {
      switch(part.type) {
        case 'indent':
          flush();
          if(options.useTabs) {
            addTabs(1);
          } else {
            addSpaces(options.tabWidth);
          }
          break;
        case 'stringAlign':
          flush();
          value += part.n;
          length += part.n.length;
          break;
        case 'numberAlign':
          lastTabs += 1;
          lastSpaces += part.n;
          break;
        /* istanbul ignore next */
        default:
          throw new Error(`Unexpected type '${part.type}'`);
      }
    });

    flushSpaces();

    return {...ind, value, length, queue};
  }

  static fits(next, restCommands, width, options, mustBeFlat?) {
    let restIdx: number = restCommands.length;
    const cmds = [next];

    while(width >= 0) {
      if(cmds.length === 0) {
        if(restIdx === 0) {
          return true;
        }
        cmds.push(restCommands[restIdx - 1]);

        restIdx--;

        continue;
      }

      const x = cmds.pop();
      const ind = x[0];
      const mode = x[1];
      const doc = x[2];

      if(typeof doc === 'string') {
        width -= Util.getStringWidth(doc);
      } else {
        switch(doc.type) {
          case 'concat':
            for(let i = doc.parts.length - 1; i >= 0; i--) {
              cmds.push([ind, mode, doc.parts[i]]);
            }

            break;
          case 'indent':
            cmds.push([DocPrinter.makeIndent(ind, options), mode, doc.contents]);

            break;
          case 'align':
            cmds.push([DocPrinter.makeAlign(ind, doc.n, options), mode, doc.contents]);

            break;
          case 'group':
            if(mustBeFlat && doc.break) {
              return false;
            }
            cmds.push([ind, doc.break ? DocPrinter.MODE_BREAK : mode, doc.contents]);

            break;
          case 'fill':
            for(let i = doc.parts.length - 1; i >= 0; i--) {
              cmds.push([ind, mode, doc.parts[i]]);
            }

            break;
          case 'if-break':
            if(mode === DocPrinter.MODE_BREAK) {
              if(doc.breakContents) {
                cmds.push([ind, mode, doc.breakContents]);
              }
            }
            if(mode === DocPrinter.MODE_FLAT) {
              if(doc.flatContents) {
                cmds.push([ind, mode, doc.flatContents]);
              }
            }

            break;
          case 'line':
            switch(mode) {
              // fallthrough
              case DocPrinter.MODE_FLAT:
                if(!doc.hard) {
                  if(!doc.soft) {
                    width -= 1;
                  }

                  break;
                }
                return true;

              case DocPrinter.MODE_BREAK:
                return true;
              default:
                break;
            }
            break;
          default:
            break;
        }
      }
    }
    return false;
  }

  static printDocToString(document, options) {
    const width = options.maxLineLength;
    const newLine = options.newLine || '\n';
    let pos = 0;
    // cmds is basically a stack. We've turned a recursive call into a
    // while loop which is much faster. The while loop below adds new
    // cmds to the array instead of recursively calling `print`.
    const cmds = [[DocPrinter.rootIndent(), DocPrinter.MODE_BREAK, document]];
    const out = [];
    let shouldRemeasure = false;
    let lineSuffix = [];

    while(cmds.length !== 0) {
      const x = cmds.pop();
      const ind = x[0];
      const mode = x[1];
      const doc = x[2];

      if(typeof doc === 'string') {
        out.push(doc);

        pos += Util.getStringWidth(doc);
      } else {
        switch(doc.type) {
          case 'cursor':
            out.push(DocBuilders.cursor.placeholder);

            break;
          case 'concat':
            for(let i = doc.parts.length - 1; i >= 0; i--) {
              cmds.push([ind, mode, doc.parts[i]]);
            }

            break;
          case 'indent':
            cmds.push([DocPrinter.makeIndent(ind, options), mode, doc.contents]);

            break;
          case 'align':
            cmds.push([DocPrinter.makeAlign(ind, doc.n, options), mode, doc.contents]);

            break;
          case 'group':
            switch(mode) {
              default:
                break;
              case DocPrinter.MODE_FLAT:
                if(!shouldRemeasure) {
                  cmds.push([ind, doc.break ? DocPrinter.MODE_BREAK : DocPrinter.MODE_FLAT, doc.contents]);
                  break;
                }
                // fallthrough

              case DocPrinter.MODE_BREAK: {
                shouldRemeasure = false;
                const next = [ind, DocPrinter.MODE_FLAT, doc.contents];
                const rem = width - pos;

                if(!doc.break && DocPrinter.fits(next, cmds, rem, options)) {
                  cmds.push(next);
                } else {
                  // Expanded states are a rare case where a document
                  // can manually provide multiple representations of
                  // itself. It provides an array of documents
                  // going from the least expanded (most flattened)
                  // representation first to the most expanded. If a
                  // group has these, we need to manually go through
                  // these states and find the first one that fits.
                  if(doc.expandedStates) {
                    const mostExpanded =
                      doc.expandedStates[doc.expandedStates.length - 1];

                    if(doc.break) {
                      cmds.push([ind, DocPrinter.MODE_BREAK, mostExpanded]);

                      break;
                    } else {
                      for(let i = 1; i < doc.expandedStates.length + 1; i++) {
                        if(i >= doc.expandedStates.length) {
                          cmds.push([ind, DocPrinter.MODE_BREAK, mostExpanded]);

                          break;
                        } else {
                          const state = doc.expandedStates[i];
                          const cmd = [ind, DocPrinter.MODE_FLAT, state];

                          if(DocPrinter.fits(cmd, cmds, rem, options)) {
                            cmds.push(cmd);

                            break;
                          }
                        }
                      }
                    }
                  } else {
                    cmds.push([ind, DocPrinter.MODE_BREAK, doc.contents]);
                  }
                }

                break;
              }
            }
            break;
          // Fills each line with as much code as possible before moving to a new
          // line with the same indentation.
          //
          // Expects doc.parts to be an array of alternating content and
          // whitespace. The whitespace contains the linebreaks.
          //
          // For example:
          //   ["I", line, "love", line, "monkeys"]
          // or
          //   [{ type: group, ... }, softline, { type: group, ... }]
          //
          // It uses this parts structure to handle three main layout cases:
          // * The first two content items fit on the same line without
          //   breaking
          //   -> output the first content item and the whitespace "flat".
          // * Only the first content item fits on the line without breaking
          //   -> output the first content item "flat" and the whitespace with
          //   "break".
          // * Neither content item fits on the line without breaking
          //   -> output the first content item and the whitespace with "break".
          case 'fill': {
            const rem = width - pos;

            const {parts} = doc;
            if(parts.length === 0) {
              break;
            }

            const content = parts[0];
            const contentFlatCmd = [ind, DocPrinter.MODE_FLAT, content];
            const contentBreakCmd = [ind, DocPrinter.MODE_BREAK, content];
            const contentFits = DocPrinter.fits(contentFlatCmd, [], rem, options, true);

            if(parts.length === 1) {
              if(contentFits) {
                cmds.push(contentFlatCmd);
              } else {
                cmds.push(contentBreakCmd);
              }
              break;
            }

            const whitespace = parts[1];
            const whitespaceFlatCmd = [ind, DocPrinter.MODE_FLAT, whitespace];
            const whitespaceBreakCmd = [ind, DocPrinter.MODE_BREAK, whitespace];

            if(parts.length === 2) {
              if(contentFits) {
                cmds.push(whitespaceFlatCmd);
                cmds.push(contentFlatCmd);
              } else {
                cmds.push(whitespaceBreakCmd);
                cmds.push(contentBreakCmd);
              }
              break;
            }

            // At this point we've handled the first pair (context, separator)
            // and will create a new fill doc for the rest of the content.
            // Ideally we wouldn't mutate the array here but coping all the
            // elements to a new array would make this algorithm quadratic,
            // which is unusable for large arrays (e.g. large texts in JSX).
            parts.splice(0, 2);
            const remainingCmd = [ind, mode, DocBuilders.fill(parts)];

            const secondContent = parts[0];

            const firstAndSecondContentFlatCmd = [
              ind,
              DocPrinter.MODE_FLAT,
              DocBuilders.concat([content, whitespace, secondContent])
            ];
            const firstAndSecondContentFits = DocPrinter.fits(
              firstAndSecondContentFlatCmd,
              [],
              rem,
              options,
              true
            );

            if(firstAndSecondContentFits) {
              cmds.push(remainingCmd);
              cmds.push(whitespaceFlatCmd);
              cmds.push(contentFlatCmd);
            } else if(contentFits) {
              cmds.push(remainingCmd);
              cmds.push(whitespaceBreakCmd);
              cmds.push(contentFlatCmd);
            } else {
              cmds.push(remainingCmd);
              cmds.push(whitespaceBreakCmd);
              cmds.push(contentBreakCmd);
            }
            break;
          }
          case 'if-break':
            if(mode === DocPrinter.MODE_BREAK) {
              if(doc.breakContents) {
                cmds.push([ind, mode, doc.breakContents]);
              }
            }
            if(mode === DocPrinter.MODE_FLAT) {
              if(doc.flatContents) {
                cmds.push([ind, mode, doc.flatContents]);
              }
            }

            break;
          case 'line-suffix':
            lineSuffix.push([ind, mode, doc.contents]);
            break;
          case 'line-suffix-boundary':
            if(lineSuffix.length > 0) {
              cmds.push([ind, mode, {type: 'line', hard: true}]);
            }
            break;
          case 'line':
            switch(mode) {
              default:
                break;
              case DocPrinter.MODE_FLAT:
                if(!doc.hard) {
                  if(!doc.soft) {
                    out.push(' ');

                    pos += 1;
                  }

                  break;
                } else {
                  // This line was forced into the output even if we
                  // were in flattened mode, so we need to tell the next
                  // group that no matter what, it needs to remeasure
                  // because the previous measurement didn't accurately
                  // capture the entire expression (this is necessary
                  // for nested groups)
                  shouldRemeasure = true;
                }
                // fallthrough

              case DocPrinter.MODE_BREAK:
                if(lineSuffix.length) {
                  cmds.push([ind, mode, doc]);
                  [].push.apply(cmds, lineSuffix.reverse());
                  lineSuffix = [];
                  break;
                }

                if(doc.literal) {
                  if(ind.root) {
                    out.push(newLine, ind.root.value);
                    pos = ind.root.length;
                  } else {
                    out.push(newLine);
                    pos = 0;
                  }
                } else {
                  if(out.length > 0) {
                    // Trim whitespace at the end of line
                    while(
                      out.length > 0 &&
                      out[out.length - 1].match(/^[^\S\n]*$/)
                    ) {
                      out.pop();
                    }

                    if(
                      out.length &&
                      (options.parser !== 'markdown' ||
                        // preserve markdown's `break` node (two trailing spaces)
                        !/\S {2}$/.test(out[out.length - 1]))
                    ) {
                      out[out.length - 1] = out[out.length - 1].replace(
                        /[^\S\n]*$/,
                        ''
                      );
                    }
                  }

                  out.push(newLine + ind.value);
                  pos = ind.length;
                }
                break;
            }
            break;
          default:
            break;
        }
      }
    }

    const cursorPlaceholderIndex = out.indexOf(DocBuilders.cursor.placeholder);

    if(cursorPlaceholderIndex !== -1) {
      const beforeCursor = out.slice(0, cursorPlaceholderIndex).join('');
      const afterCursor = out.slice(cursorPlaceholderIndex + 1).join('');

      return {
        cursor: beforeCursor.length,
        formatted: beforeCursor + afterCursor
      };
    }

    return {formatted: out.join('')};
  }
}
