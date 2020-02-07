import semver from 'semver';

import {arrayify} from '../utils/arrayify';
import {options as coreOptions} from './coreOptions';
import {SFSupportOptions} from './support.types';


const {version: currentVersion} = require('../../package.json');

export const filterSince = (version: string, opts: SFSupportOptions) => (object) => (
  opts.showUnreleased
  || !('since' in object)
  || (object.since && semver.gte(version, object.since))
);

export const filterDeprecated = (version: string, opts: SFSupportOptions) => (object) => (
  opts.showDeprecated
  || !('deprecated' in object)
  || (object.deprecated && semver.lt(version, object.deprecated))
);

export const mapDeprecated = (opts: SFSupportOptions) => (object) => {
  if(!object.deprecated || opts.showDeprecated) {
    return object;
  }

  const newObject = {...object};
  delete newObject.deprecated;
  delete newObject.redirect;
  return newObject;
};

export const mapInternal = (opts: SFSupportOptions) => (object) => {
  if(opts.showInternal) {
    return object;
  }
  const newObject = {...object};
  delete newObject.cliName;
  delete newObject.cliCategory;
  delete newObject.cliDescription;
  return newObject;
};

export const getSupportInfo = (version: string, opts: SFSupportOptions) => {
  let updatedVersion: string = version;
  const updatedOpts: SFSupportOptions = {
    plugins: [],
    showUnreleased: false,
    showDeprecated: false,
    showInternal: false,
    ...opts
  };

  if(!updatedVersion) {
    // pre-release version is smaller than the normal version in semver,
    // we need to treat it as the normal one so as to test new features.
    updatedVersion = currentVersion.split('-', 1)[0];
  }

  const {plugins} = updatedOpts;
  const options: SFSupportOptions = arrayify(
    {
      ...plugins.reduce((currentOptions, plugin) => ({...currentOptions, ...plugin.options}), {}),
      coreOptions
    },
    'name'
  )
    .sort((a, b) => (a.name === b.name ? 0 : a.name < b.name ? -1 : 1))
    .filter(filterSince(updatedVersion, updatedOpts))
    .filter(filterDeprecated(updatedVersion, updatedOpts))
    .map(mapDeprecated(updatedOpts))
    .map(mapInternal(updatedOpts))
    .map((option) => {
      const newOption = {...option};

      if(Array.isArray(newOption.default)) {
        newOption.default =
          newOption.default.length === 1
            ? newOption.default[0].value
            : newOption.default
              .filter(filterSince(updatedVersion, updatedOpts))
              .sort((info1, info2) =>
                semver.compare(info2.since, info1.since)
              )[0].value;
      }

      if(Array.isArray(newOption.choices)) {
        newOption.choices = newOption.choices
          .filter(filterSince(updatedVersion, updatedOpts))
          .filter(filterDeprecated(updatedVersion, updatedOpts))
          .map(mapDeprecated(updatedOpts));
      }

      return newOption;
    })
    .map((option) => {
      const filteredPlugins = plugins.filter(
        (plugin) =>
          plugin.defaultOptions &&
          plugin.defaultOptions[option.name] !== undefined
      );
      const pluginDefaults = filteredPlugins.reduce((reduced, plugin) => {
        reduced[plugin.name] = plugin.defaultOptions[option.name];
        return reduced;
      }, {});

      return {...option, pluginDefaults};
    });

  const usePostCssParser = semver.lt(updatedVersion, '1.7.1');
  const useBabylonParser = semver.lt(updatedVersion, '1.16.0');

  const languages = plugins
    .reduce((all, plugin) => all.concat(plugin.languages || []), [])
    .filter(filterSince(updatedVersion, updatedOpts))
    .map((language) => {
      // Prevent breaking changes
      if(language.name === 'Markdown') {
        return {...language, parsers: ['markdown']};
      }
      if(language.name === 'TypeScript') {
        return {...language, parsers: ['typescript']};
      }

      // "babylon" was renamed to "babel" in 1.16.0
      if(useBabylonParser && language.parsers.indexOf('babel') !== -1) {
        return {
          ...language,
          parsers: language.parsers.map((parser) =>
            (parser === 'babel' ? 'babylon' : parser)
          )
        };
      }

      if(usePostCssParser && (language.name === 'CSS' || language.group === 'CSS')) {
        return {...language, parsers: ['postcss']};
      }

      return language;
    });

  return {languages, options};
};
