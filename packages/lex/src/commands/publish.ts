/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import semver, {ReleaseType} from 'semver';

import {LexConfig} from '../LexConfig.js';
import {createSpinner, getPackageJson, setPackageJson} from '../utils/app.js';
import {log} from '../utils/log.js';

export const publish = async (cmd, callback: any = process.exit): Promise<number> => {
  const {bump, cliName = 'Lex', newVersion, otp, packageManager: cmdPackageManager, private: accessPrivate, tag, quiet} = cmd;
  log(`${cliName} publishing npm module...`, 'info', quiet);

  // Spinner
  const spinner = createSpinner(quiet);

  // Get custom configuration
  await LexConfig.parseConfig(cmd);

  const {packageManager: configPackageManager} = LexConfig.config;
  const packageManager: string = cmdPackageManager || configPackageManager;
  const publishOptions: string[] = ['publish'];

  if(accessPrivate) {
    publishOptions.push('--access', 'restricted');
  }

  if(otp) {
    publishOptions.push('--otp', otp);
  }

  if(tag) {
    publishOptions.push('--tag', tag);
  }

  // Get next version number
  let nextVersion: string;
  const packagePath: string = `${process.cwd()}/package.json`;
  let packageJson;
  let packageName: string;
  let prevVersion: string;

  // If not using yarn, we'll use npm and manually update the version number
  try {
    packageJson = getPackageJson(packagePath);
    packageName = packageJson.name;
    prevVersion = packageJson.version;
  } catch(error) {
    log(`\n${cliName} Error: The file, ${packagePath}, was not found or is malformed.\n`, 'error', quiet);
    log(error.message, 'error');
    callback(1);
    return 1;
  }

  // Update package.json with the latest version
  if(newVersion) {
    // If using a specific version, we don't need to determine the next bump
    nextVersion = newVersion;
  } else if(bump) {
    // Determine next version
    const formatBump: ReleaseType = bump.toString()
      .trim()
      .toLowerCase();

    if(formatBump) {
      const validReleases: string[] = ['major', 'minor', 'patch'];
      const validPreReleases: string[] = ['alpha', 'beta', 'rc'];

      // Make sure the version in package.json is valid
      const packageVersion = semver.coerce(prevVersion);

      if(!semver.valid(packageVersion)) {
        log(`\n${cliName} Error: Version is invalid in package.json`, 'error', quiet);
        callback(1);
        return 1;
      }

      if(validReleases.includes(formatBump)) {
        nextVersion = semver.inc(packageVersion, formatBump);
      } else if(validPreReleases.includes(formatBump)) {
        nextVersion = semver.inc(packageVersion, 'prerelease', formatBump);
      } else {
        log(`\n${cliName} Error: Bump type is invalid. please make sure it is one of the following: ${validReleases.join(', ')}, ${validPreReleases.join(', ')}`, 'error', quiet);
        callback(1);
        return 1;
      }
    } else {
      log(`\n${cliName} Error: Bump type is missing.`, 'error', quiet);
      callback(1);
      return 1;
    }
  }

  if(nextVersion && packageManager === 'yarn') {
    publishOptions.push('--new-version', nextVersion);
  } else if(nextVersion && packageJson) {
    try {
      // Save updated version
      setPackageJson({...packageJson, version: nextVersion}, packagePath);
    } catch(error) {
      log(`\n${cliName} Error: The file, ${packagePath}, was not found or is malformed. ${error.message}`, quiet);
      callback(1);
      return 1;
    }
  } else {
    nextVersion = prevVersion;
  }

  try {
    await execa(packageManager, publishOptions, {
      encoding: 'utf8',
      stdio: 'inherit'
    });

    spinner.succeed(`Successfully published npm package: ${packageName}!`);

    // Kill process
    callback(0);
    return 0;
  } catch(error) {
    // Display error message
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    // Stop spinner
    spinner.fail('Publishing to npm has failed.');

    // Kill process
    callback(1);
    return 1;
  }
};
