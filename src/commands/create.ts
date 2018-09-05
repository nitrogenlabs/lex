import {createChangelog} from '../create/changelog';
import {LexConfig} from '../LexConfig';
import {log} from '../utils';

export const create = (type: string, cmd) => {
  const {cliName = 'Lex', output, quiet} = cmd;
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
      return createChangelog({config, output, quiet});
  }

  return process.exit(0);
};
