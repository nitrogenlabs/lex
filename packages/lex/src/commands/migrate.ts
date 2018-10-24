import execa from 'execa';

import {LexConfig} from '../LexConfig';
import {createSpinner, getPackageJson, log, removeConflictModules, removeModules} from '../utils';

export const migrate = async (cmd: any, callback: any = process.exit) => {
  const {cliName = 'Lex', packageManager: cmdPackageManager, quiet} = cmd;

  const cwd: string = process.cwd();

  // // Display message
  // log(`${cliName} copying "${to}"...`, 'info', quiet);

  // Spinner
  const spinner = createSpinner(quiet);
  spinner.start('Removing node modules...');

  // Remove node_modules
  await removeModules();

  const {packageManager: configPackageManager} = LexConfig.config;
  const packageManager: string = cmdPackageManager || configPackageManager;
  const packagePath: string = `${cwd}/package.json`;
  const appPackage = getPackageJson(packagePath);
  const {dependencies = {}, devDependencies = {}} = appPackage;

  // Remove Babel, Jest and Webpack from app since it will conflict
  appPackage.dependencies = removeConflictModules(dependencies);
  appPackage.devDependencies = removeConflictModules(devDependencies);

  // Install new list of packages
  try {
    const installDep = await execa(packageManager, ['install'], {
      encoding: 'utf-8',
      stdio: 'inherit'
    });

    const installStatus: number = installDep.status;

    // Stop loader
    if(!installStatus) {
      spinner.succeed('Successfully migrated app!');
    } else {
      spinner.fail('Failed to remove modules.');
    }

    // Kill process
    return callback(installStatus);
  } catch(error) {
    // Display error message
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    // Stop spinner
    spinner.fail('Failed to remove modules.');

    // Kill process
    return callback(1);
  }
};
