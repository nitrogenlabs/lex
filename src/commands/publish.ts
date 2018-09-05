import chalk from 'chalk';
import execa from 'execa';
import semver from 'semver';

import {LexConfig} from '../LexConfig';
import {createSpinner, getPackageJson, log, setPackageJson} from '../utils';

export const publish = async (cmd) => {
  const {bump, cliName = 'Lex', newVersion, otp, packageManager: cmdPackageManager, private: accessPrivate, tag, quiet} = cmd;
  log(`${cliName} publishing npm module...`, 'info', quiet);

  // Spinner
  const spinner = createSpinner(quiet);

  // Get custom configuration
  LexConfig.parseConfig(cmd);

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
    log(`${cliName} Error: The file, ${packagePath}, was not found or is malformed.\n`, 'error', quiet);
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
        log(`${cliName} Error: Version is invalid in package.json`, 'error', quiet);
        return process.exit(1);
      }

      if(validReleases.includes(formatBump)) {
        nextVersion = semver.inc(packageVersion, formatBump);
      } else if(validPreReleases.includes(formatBump)) {
        nextVersion = semver.inc(packageVersion, 'prerelease', formatBump);
      } else {
        log(`${cliName} Error: Bump type is invalid. please make sure it is one of the following: ${validReleases.join(', ')}, ${validPreReleases.join(', ')}`, 'error', quiet);
        return process.exit(1);
      }
    } else {
      log(`${cliName} Error: Bump type is missing.`, 'error', quiet);
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
      log(`${cliName} Error: The file, ${packagePath}, was not found or is malformed. ${error.message}`, quiet);
      return process.exit(1);
    }
  } else {
    nextVersion = prevVersion;
  }

  try {
    const npmPublish = await execa(packageManager, publishOptions, {
      encoding: 'utf-8',
      stdio: 'inherit'
    });

    if(!npmPublish.status) {
      spinner.succeed(`Successfully published npm package: ${packageName}!`);
    } else {
      spinner.fail('Publishing to npm has failed.');
    }

    // Kill process
    return process.exit(npmPublish.status);
  } catch(error) {
    // Display error message
    log(`${cliName} Error: ${error.message}`, 'error', quiet);

    // Stop spinner
    spinner.fail('Publishing to npm has failed.');

    // Kill process
    return process.exit(1);
  }
};
