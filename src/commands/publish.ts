import chalk from 'chalk';
import {spawnSync, SpawnSyncReturns} from 'child_process';
import semver from 'semver';

import {LexConfig} from '../LexConfig';
import {getPackageJson, log, setPackageJson} from '../utils';

export const publish = (cmd) => {
  log(chalk.cyan('Lex publishing npm module...'), cmd);

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  const {bump, private: accessPrivate, otp, tag, version} = cmd;
  const {packageManager} = LexConfig.config;
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

  if(bump) {
    const formatBump: string = bump.toString()
      .trim()
      .toLowerCase();

    const packagePath: string = `${process.cwd()}/package.json`;

    if(formatBump) {
      const validReleases: string[] = ['major', 'minor', 'patch'];
      const validPreReleases: string[] = ['alpha', 'beta', 'rc'];

      try {
        // Update package.json with the latest version
        const packageJson = getPackageJson(packagePath);

        // Make sure the version in package.json is valid
        const {version: prevVersion} = packageJson;
        const packageVersion = semver.coerce(prevVersion);
        let nextVersion: string;

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
        }

        // Save updated version
        setPackageJson({...packageJson, version: nextVersion}, packagePath);
      } catch(error) {
        log(chalk.red(`Lex Error: The file, ${packagePath}, was not found or is malformed.`), cmd);
        console.error(chalk.red(error.message));
        return process.exit(1);
      }
    } else {
      if(packageManager === 'yarn') {
        if(version) {
          publishOptions.push('--new-version', version);
        }
      } else {
        if(version) {
          try {
            // Get the current version from package.json
            const packageJson = getPackageJson(packagePath);

            // Save updated version
            setPackageJson({...packageJson, version});
          } catch(error) {
            log(chalk.red(`Lex Error: The file, ${packagePath}, was not found.`), cmd);
            return process.exit(1);
          }
        }
      }
    }
  }

  const npmPublish: SpawnSyncReturns<Buffer> = spawnSync(packageManager, publishOptions, {
    encoding: 'utf-8',
    stdio: 'inherit'
  });

  return process.exit(npmPublish.status);
};
