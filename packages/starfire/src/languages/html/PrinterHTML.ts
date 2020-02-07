import {Util} from '../../common/util';
import {DocBuilders} from '../../doc/DocBuilders';


const {concat, dedent, group, hardline, indent, join, softline} = DocBuilders;

export class PrinterHTML {
  static print = PrinterHTML.genericPrint;
  static hasPrettierIgnore = Util.hasIgnoreComment;

  // http://w3c.github.io/html/single-page.html#void-elements
  static voidTags = {
    area: true,
    base: true,
    br: true,
    col: true,
    embed: true,
    hr: true,
    img: true,
    input: true,
    link: true,
    meta: true,
    param: true,
    source: true,
    track: true,
    wbr: true
  };

  static genericPrint(path, options, print) {
    const n = path.getValue();

    if(!n) {
      return '';
    }

    if(typeof n === 'string') {
      return n;
    }

    switch(n.type) {
      case 'root': {
        return PrinterHTML.printChildren(path, print);
      }
      case 'directive': {
        return concat(['<', n.data, '>', hardline]);
      }
      case 'text': {
        return n.data.replace(/\s+/g, ' ').trim();
      }
      case 'script':
      case 'style':
      case 'tag': {
        const nodeName: string = n.name.toLowerCase();
        const voidTag: boolean = PrinterHTML.voidTags[nodeName];
        const selfClose = voidTag ? '>' : ' />';
        const children = PrinterHTML.printChildren(path, print);
        // const hasNewline = Util.hasNewlineInRange(options.originalText, options.locStart(n), options.locEnd(n));
        const childLength: number = n.children.length;
        let initialBreak: any = '';
        const hasStartBreak: boolean = ((n.prev || {}).data || '').indexOf('\n') >= 0;

        if(n.parent.type === 'root') {
          initialBreak = '';
        } else {
          initialBreak = hasStartBreak ? hardline : '';
        }

        const firstChildType: string = childLength && n.children[0].type;
        const tagBreak = firstChildType === 'text' ? '' : hardline;

        return group(
          concat([
            initialBreak,
            '<',
            nodeName,
            PrinterHTML.printAttributes(path, print),
            childLength ? concat(['>', tagBreak]) : concat([selfClose, '']),
            nodeName === 'html' ? concat([hardline, children]) : indent(children),
            childLength ? dedent(concat([tagBreak, '</', nodeName, '>', hardline])) : hardline
          ])
        );
      }
      case 'comment': {
        const isRoot: boolean = n.parent.type === 'root';
        const startBreak = isRoot ? '' : softline;
        const endBreak = isRoot ? hardline : '';
        return concat([startBreak, '<!-- ', n.data.trim(), ' -->', endBreak]);
      }
      case 'attribute': {
        const attributeName: string = n.key.toLowerCase();

        if(!n.value) {
          return attributeName;
        }

        return concat([attributeName, '="', n.value, '"']);
      }
      default:
        /* istanbul ignore next */
        throw new Error(`Unknown htmlparser2 type: ${n.type}`);
    }
  }

  static printAttributes(path, print) {
    const node = path.getValue();
    const attributes = indent(join('', path.map(print, 'attributes')));
    return concat([node.attributes.length ? ' ' : '', attributes]);
  }

  static printChildren(path, print) {
    const children = [];

    path.each((childPath) => {
      // const child = childPath.getValue();
      // if(child.type !== 'text') {
      //   children.push(hardline);
      // }
      children.push(childPath.call(print));
    }, 'children');
    return concat(children);
  }
}
