import fs from 'fs';
import globby from 'globby';
import uniqBy from 'lodash/uniqBy.js';
import path from 'path';
import resolve from 'resolve';

import partition from '../utils/partition.js';
import * as internalPlugins from './internalPlugins.js';
import {findParentDir} from './thirdParty.js';

const findPluginsInNodeModules = (nodeModulesDir) => {
  const pluginPackageJsonPaths = globby.sync(
    [
      'prettier-plugin-*/package.json',
      '@*/prettier-plugin-*/package.json',
      '@prettier/plugin-*/package.json'
    ],
    {cwd: nodeModulesDir}
  );
  return pluginPackageJsonPaths.map(path.dirname);
};

const isDirectory = (dir): boolean => {
  try {
    return fs.statSync(dir).isDirectory();
  } catch(e) {
    return false;
  }
};

export const loadPlugins = (plugins = [], pluginSearchDirs = []) => {
  const updatedPlugins = [...plugins];
  let updatedSearchDir = [...pluginSearchDirs];

  // unless pluginSearchDirs are provided, auto-load plugins from node_modules that are parent to Prettier
  if(!updatedSearchDir.length) {
    const autoLoadDir = findParentDir(__dirname, 'node_modules');

    if(autoLoadDir) {
      updatedSearchDir = [autoLoadDir];
    }
  }

  const [externalPluginNames, externalPluginInstances] = partition(
    updatedPlugins,
    (plugin) => typeof plugin === 'string'
  );

  const externalManualLoadPluginInfos = externalPluginNames.map((pluginName) => {
    let requirePath: string;

    try {
      // try local files
      requirePath = resolve.sync(path.resolve(process.cwd(), pluginName));
    } catch(e) {
      // try node modules
      requirePath = resolve.sync(pluginName, {basedir: process.cwd()});
    }
    return {
      name: pluginName,
      requirePath
    };
  });

  const externalAutoLoadPluginInfos = updatedSearchDir
    .map((pluginSearchDir) => {
      const resolvedPluginSearchDir = path.resolve(
        process.cwd(),
        pluginSearchDir
      );

      const nodeModulesDir = path.resolve(
        resolvedPluginSearchDir,
        'node_modules'
      );

      // In some fringe cases (ex: files "mounted" as virtual directories), the
      // isDirectory(resolvedPluginSearchDir) check might be false even though
      // the node_modules actually exists.
      if(
        !isDirectory(nodeModulesDir) &&
        !isDirectory(resolvedPluginSearchDir)
      ) {
        throw new Error(
          `${pluginSearchDir} does not exist or is not a directory`
        );
      }

      return findPluginsInNodeModules(nodeModulesDir).map((pluginName) => ({
        name: pluginName,
        requirePath: resolve.sync(pluginName, {
          basedir: resolvedPluginSearchDir
        })
      }));
    })
    .reduce((a, b) => a.concat(b), []);

  const externalPlugins = uniqBy(externalManualLoadPluginInfos.concat(externalAutoLoadPluginInfos), 'requirePath')
    .map((externalPluginInfo) =>
      Object.assign(
        {name: externalPluginInfo.name},
        eval('require')(externalPluginInfo.requirePath)
      )
    )
    .concat(externalPluginInstances);

  return internalPlugins.concat(externalPlugins);
};
