import chalk from 'chalk';
import {spawnSync, SpawnSyncReturns} from 'child_process';
import semver from 'semver';

import {LexConfig} from '../LexConfig';
import {getPackageJson, log, setPackageJson} from '../utils';

export const publish = (cmd) => {
  log(chalk.cyan('Lex publishing npm module...'), cmd);

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  const {bump, newVersion, otp, private: accessPrivate, packageManager: cmdPackageManager, tag} = cmd;
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
    log(chalk.red(`Lex Error: The file, ${packagePath}, was not found or is malformed.`), cmd);
    console.error(chalk.red(error.message));
    return process.exit(1);
  }

  // Update package.json with the latest version
  if(newVersion) {
    // If using a specific version, we don't need to determine the next bump
    nextVersion = newVersion;
  } else if(bump) {
    // Determine next version
    const formatBump: string = bump.toString()
      .trim()
      .toLowerCase();

    if(formatBump && formatBump !== '') {
      const validReleases: string[] = ['major', 'minor', 'patch'];
      const validPreReleases: string[] = ['alpha', 'beta', 'rc'];

      // Make sure the version in package.json is valid
      const packageVersion = semver.coerce(prevVersion);

      if(!semver.valid(packageVersion)) {
        log(chalk.red('Lex Error: Version is invalid in package.json'), cmd);
        return process.exit(1);
      }

      if(validReleases.includes(formatBump)) {
        nextVersion = semver.inc(packageVersion, formatBump);
      } else if(validPreReleases.includes(formatBump)) {
        nextVersion = semver.inc(packageVersion, 'prerelease', formatBump);
      } else {
        log(chalk.red(`Lex Error: Bump type is invalid. please make sure it is one of the following: ${validReleases.join(', ')}, ${validPreReleases.join(', ')}`), cmd);
        return process.exit(1);
      }
    } else {
      log(chalk.red('Lex Error: Bump type is missing.'), cmd);
      return process.exit(1);
    }
  }

  if(nextVersion && packageManager === 'yarn') {
    publishOptions.push('--new-version', nextVersion);
  } else if(nextVersion && packageJson) {
    try {
      // Save updated version
      setPackageJson({...packageJson, version: nextVersion}, packagePath);
    } catch(error) {
      log(chalk.red(`Lex Error: The file, ${packagePath}, was not found or is malformed.`), cmd);
      console.error(chalk.red(error.message));
      return process.exit(1);
    }
  } else {
    nextVersion = prevVersion;
  }

  const npmPublish: SpawnSyncReturns<Buffer> = spawnSync(packageManager, publishOptions, {
    encoding: 'utf-8',
    stdio: 'inherit'
  });

  log(chalk.greenBright(`Successfully published npm package: ${packageName}@${nextVersion}`), cmd);
  return process.exit(npmPublish.status);
};
