import {default as dedent} from 'dedent';
import * as semver from 'semver';

import * as jsonPackage from '../../package.json';
import {CLIConstants} from '../cli/CLIConstants';
import {SFSupportType} from '../types/support';
import {LoadPlugins} from './LoadPlugins';
import {Util} from './Util';

/**
 * @typedef {Object} OptionInfo
 * @property {string} since - available since version
 * @property {string} category
 * @property {'int' | 'boolean' | 'choice' | 'path'} type
 * @property {boolean} array - indicate it's an array of the specified type
 * @property {boolean?} deprecated - deprecated since version
 * @property {OptionRedirectInfo?} redirect - redirect deprecated option
 * @property {string} description
 * @property {string?} oppositeDescription - for `false` option
 * @property {OptionValueInfo} default
 * @property {OptionRangeInfo?} range - for type int
 * @property {OptionChoiceInfo?} choices - for type choice
 * @property {(value: any) => boolean} exception
 *
 * @typedef {number | boolean | string} OptionValue
 * @typedef {OptionValue | [{ value: OptionValue[] }] | Array<{ since: string, value: OptionValue}>} OptionValueInfo
 *
 * @typedef {Object} OptionRedirectInfo
 * @property {string} option
 * @property {OptionValue} value
 *
 * @typedef {Object} OptionRangeInfo
 * @property {number} start - recommended range start
 * @property {number} end - recommended range end
 * @property {number} step - recommended range step
 *
 * @typedef {Object} OptionChoiceInfo
 * @property {boolean | string} value - boolean for the option that is originally boolean type
 * @property {string?} description - undefined if redirect
 * @property {string?} since - undefined if available since the first version of the option
 * @property {string?} deprecated - deprecated since version
 * @property {OptionValueInfo?} redirect - redirect deprecated value
 *
 * @property {string?} cliName
 * @property {string?} cliCategory
 * @property {string?} cliDescription
 */
/** @type {{ [name: string]: OptionInfo } */

export class Support {
  static CATEGORY_GLOBAL: string = 'Global';
  static CATEGORY_SPECIAL: string = 'Special';
  static options = {
    cursorOffset: {
      category: Support.CATEGORY_SPECIAL,
      cliCategory: CLIConstants.CATEGORY_EDITOR,
      default: -1,
      description: dedent`
      Print (to stderr) where a cursor at the given position would move to after formatting.
      This option cannot be used with --range-start and --range-end.`,
      range: {start: -1, end: Infinity, step: 1},
      since: '0.0.0',
      type: 'int'
    },
    filePath: {
      category: Support.CATEGORY_SPECIAL,
      cliCategory: CLIConstants.CATEGORY_OTHER,
      cliDescription: 'Path to the file to pretend that stdin comes from.',
      cliName: 'stdin-filepath',
      default: undefined,
      description: 'Specify the input filePath. This will be used to do parser inference.',
      since: '0.0.0',
      type: 'path'
    },
    insertPragma: {
      category: Support.CATEGORY_SPECIAL,
      cliCategory: CLIConstants.CATEGORY_OTHER,
      default: false,
      description: 'Insert @format pragma into file\'s first docblock comment.',
      since: '0.0.0',
      type: 'boolean'
    },
    maxLineLength: {
      category: Support.CATEGORY_GLOBAL,
      default: 120,
      description: 'The line length where Starfire will try wrap.',
      range: {start: 0, end: Infinity, step: 1},
      since: '0.0.0',
      type: 'int'
    },
    parser: {
      category: Support.CATEGORY_GLOBAL,
      choices: [
        {value: 'flow', description: 'Flow'},
        {value: 'babylon', description: 'JavaScript'},
        {value: 'typescript', since: '0.0.0', description: 'TypeScript'},
        {value: 'css', since: '0.0.0', description: 'CSS'},
        {value: 'less', since: '0.0.0', description: 'LESS'},
        {value: 'scss', since: '0.0.0', description: 'SCSS'},
        {value: 'json', since: '0.0.0', description: 'JSON'},
        {value: 'graphql', since: '0.0.0', description: 'GraphQL'},
        {value: 'markdown', since: '0.0.0', description: 'Markdown'}
      ],
      default: 'babylon',
      description: 'Which parser to use.',
      exception: (value) => typeof value === 'string' || typeof value === 'function',
      since: '0.0.0',
      type: 'choice'
    },
    plugins: {
      array: true,
      category: Support.CATEGORY_GLOBAL,
      cliCategory: CLIConstants.CATEGORY_CONFIG,
      cliName: 'plugin',
      default: [{value: []}],
      description: 'Add a plugin. Multiple plugins can be passed as separate `--plugin`s.',
      exception: (value) => typeof value === 'string' || typeof value === 'object',
      since: '0.0.0',
      type: 'path'
    },
    rangeEnd: {
      category: Support.CATEGORY_SPECIAL,
      cliCategory: CLIConstants.CATEGORY_EDITOR,
      default: Infinity,
      description: dedent`
      Format code ending at a given character offset (exclusive).
      The range will extend forwards to the end of the selected statement.
      This option cannot be used with --cursor-offset.`,
      range: {start: 0, end: Infinity, step: 1},
      since: '0.0.0',
      type: 'int'
    },
    rangeStart: {
      category: Support.CATEGORY_SPECIAL,
      cliCategory: CLIConstants.CATEGORY_EDITOR,
      default: 0,
      description: dedent`
      Format code starting at a given character offset.
      The range will extend backwards to the start of the first line containing the selected statement.
      This option cannot be used with --cursor-offset.`,
      range: {start: 0, end: Infinity, step: 1},
      since: '0.0.0',
      type: 'int'
    },
    requirePragma: {
      category: Support.CATEGORY_SPECIAL,
      cliCategory: CLIConstants.CATEGORY_OTHER,
      default: false,
      description: dedent`
      Require either '@starfire' or '@format' to be present in the file's first docblock comment
      in order for it to be formatted.`,
      since: '0.0.0',
      type: 'boolean'
    },
    tabWidth: {
      category: Support.CATEGORY_GLOBAL,
      default: 2,
      description: 'Number of spaces per indentation level.',
      range: {start: 0, end: Infinity, step: 1},
      type: 'int'
    },
    useTabs: {
      category: Support.CATEGORY_GLOBAL,
      default: false,
      description: 'Indent with tabs instead of spaces.',
      since: '0.0.0',
      type: 'boolean'
    }
  };

  static getSupportInfo(version?, opts?) {
    opts = {
      plugins: [],
      pluginsLoaded: false,
      showDeprecated: false,
      showInternal: false,
      showUnreleased: false,
      ...opts
    };

    if(!version) {
      const appPackage: any = {...jsonPackage};
      version = appPackage.version;
    }

    const plugins = opts.pluginsLoaded ? opts.plugins : LoadPlugins.loadPlugins(opts.plugins);
    const filterSince = (object: SFSupportType = {}) => (opts.showUnreleased || !('since' in object) || (object.since && semver.gte(version, object.since)));

    const filterDeprecated = (object) => (
      opts.showDeprecated || !('deprecated' in object) || (object.deprecated && semver.lt(version, object.deprecated))
    );

    const mapDeprecated = (object) => {
      if(!object.deprecated || opts.showDeprecated) {
        return object;
      }

      const newObject = {...object};
      delete newObject.deprecated;
      delete newObject.redirect;
      return newObject;
    };

    const mapInternal = (object) => {
      if(opts.showInternal) {
        return object;
      }

      const newObject = {...object};
      delete newObject.cliName;
      delete newObject.cliCategory;
      delete newObject.cliDescription;
      return newObject;
    };

    const options = Util.arrayify({
      ...plugins.reduce((currentOptions, plugin) => ({...currentOptions, ...plugin.options}), {}),
      ...Support.options
    }, 'name')
      .sort((a, b) => (a.name === b.name ? 0 : a.name < b.name ? -1 : 1))
      .filter(filterSince)
      .filter(filterDeprecated)
      .map(mapDeprecated)
      .map(mapInternal)
      .map((option) => {
        const newOption = {...option};

        if(Array.isArray(newOption.default)) {
          newOption.default =
            newOption.default.length === 1
              ? newOption.default[0].value
              : newOption.default
                .filter(filterSince)
                .sort((info1, info2) => semver.compare(info2.since, info1.since))[0].value;
        }

        if(Array.isArray(newOption.choices)) {
          newOption.choices = newOption.choices
            .filter(filterSince)
            .filter(filterDeprecated)
            .map(mapDeprecated);
        }

        return newOption;
      })
      .map((option) => {
        const filteredPlugins = plugins.filter((plugin) => plugin.defaultOptions && plugin.defaultOptions[option.name]);
        const pluginDefaults = filteredPlugins.reduce((reduced, plugin) => {
          reduced[plugin.name] = plugin.defaultOptions[option.name];
          return reduced;
        }, {});
        return {...option, pluginDefaults};
      });

    const languages = plugins
      .reduce((all, plugin) => all.concat(plugin.languages), [])
      .filter((language) => (language.since ? semver.gte(version, language.since) : language.since !== null))
      .map((language) => {
        // Prevent breaking changes
        if(language.name === 'Markdown') {
          return {...language, parsers: ['markdown']};
        }

        if(language.name === 'TypeScript') {
          return {...language, parsers: ['typescript']};
        }

        if(language.group === 'CSS') {
          return {...language, parsers: ['css']};
        }

        return language;
      });

    return {languages, options};
  }
}
