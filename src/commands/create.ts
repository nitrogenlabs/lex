import {createChangelog} from '../create/changelog';
import {LexConfig} from '../LexConfig';
import {log} from '../utils';

export const create = async (type: string, cmd: any, callback: any = process.exit) => {
  const {cliName = 'Lex', outputFile, quiet} = cmd;
  log(`${cliName} create ${type}...`, 'info', quiet);

  // Get custom configuration
  LexConfig.parseConfig(cmd);

  const {useTypescript} = LexConfig.config;

  if(useTypescript) {
    // Make sure tsconfig.json exists
    LexConfig.checkTypescriptConfig();
  }

  const {config} = LexConfig;

  switch(type) {
    case 'changelog':
      return callback(await createChangelog({cliName, config, outputFile, quiet}));
  }

  return callback(0);
};
