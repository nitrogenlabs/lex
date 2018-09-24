import {LexConfig} from '../LexConfig';
import {checkLinkedModules, log} from '../utils';

export const linked = async (cmd: any, callback: any = process.exit) => {
  const {cliName = 'Lex', quiet} = cmd;

  // Display status
  log(`${cliName} checking for linked modules...`, 'info', quiet);

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  // Check for linked modules
  checkLinkedModules();
  return callback(0);
};
