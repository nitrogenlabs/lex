import execa from 'execa';

import {LexConfig} from '../LexConfig';
import {createSpinner, log} from '../utils';

export const update = async (cmd) => {
  const {cliName = 'Lex', packageManager: cmdPackageManager, quiet} = cmd;

  // Display status
  log(`${cliName} updating packages...`, 'info', quiet);

  // Spinner
  const spinner = createSpinner(quiet);

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  const {packageManager: configPackageManager} = LexConfig.config;
  const packageManager: string = cmdPackageManager || configPackageManager;

  const upgradeOptions: string[] = packageManager === 'npm' ?
    ['update'] :
    [cmd.interactive ? 'upgrade-interactive' : 'upgrade', '--latest'];

  try {
    const pm = await execa(packageManager, upgradeOptions, {
      encoding: 'utf-8',
      stdio: 'inherit'
    });

    // Stop loader
    if(!pm.status) {
      spinner.succeed('Successfully updated packages!');
    } else {
      spinner.fail('Failed to updated packages.');
    }

    // Kill process
    return process.exit(pm.status);
  } catch(error) {
    // Display error message
    log(`${cliName} Error: ${error.message}`, 'error', quiet);

    // Stop spinner
    spinner.fail('Failed to updated packages.');

    // Kill process
    return process.exit(1);
  }
};
