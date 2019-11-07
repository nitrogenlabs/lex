
import * as readPkgUp from 'read-pkg-up';
import * as resolve from 'resolve';

import {LanguageCSS} from '../languages/css';
import {LanguageGraphql} from '../languages/graphql';
import {LanguageGlimmer} from '../languages/handlebars';
import {LanguageHTML} from '../languages/html';
import {LanguageJS} from '../languages/js';
import {LanguageMarkdown} from '../languages/markdown';

export class LoadPlugins {
  static loadPlugins(plugins = []) {
    const internalPlugins = [
      LanguageCSS,
      LanguageGlimmer,
      LanguageGraphql,
      LanguageHTML,
      LanguageJS,
      LanguageMarkdown
    ];

    const externalPlugins = plugins.concat(LoadPlugins.getPluginsFromPackage(readPkgUp.sync({normalize: false}).pkg))
      .map((plugin) => {
        if(typeof plugin !== 'string') {
          return plugin;
        }

        const pluginPath = resolve.sync(plugin, {basedir: process.cwd()});
        return {name: plugin, ...require(pluginPath)};
      });

    return LoadPlugins.deduplicate(internalPlugins.concat(externalPlugins));
  }

  static getPluginsFromPackage(pkg) {
    if(!pkg) {
      return [];
    }

    const deps = {...pkg.dependencies, ...pkg.devDependencies};

    return Object.keys(deps).filter((dep) => dep.startsWith('starfire-plugin-') || dep.startsWith('@starfire/plugin-'));
  }

  static deduplicate(items) {
    const uniqItems = [];

    for(const item of items) {
      if(uniqItems.indexOf(item) < 0) {
        uniqItems.push(item);
      }
    }

    return uniqItems;
  }
}

