// import {spawnSync} from 'child_process';
// import {concat} from 'lodash';
// import * as minimist from 'minimist';

// const eslintJson = require('../../.eslintrc.json');

// // import * as jsonPackage from '../../package.json';


// export const run = (args) => {
//   // const appConfig: any = {...jsonPackage};
//   // console.log('eslint override working!!');

//   // console.log('args', args);
//   // console.log('stringify::args', JSON.stringify(args, null, 2));
//   // // Get the current path
//   // const currentPath: string = process.cwd();
//   // console.log('currentPath', currentPath);

//   // commander.version(appConfig.version)
//   //   .command('ls <dir>')
//   //   .allowUnknownOption()
//   //   .option('-c, --config [file]', 'ESLint config');
//   // const parsedArgs = commander.parse(args);
//   // console.log('parsedArgs', parsedArgs);
//   // console.log('commander', commander.c);

//   // Arguments
//   // const options = minimist(args);

//   // // Run eslint
//   // const eslintConfig = {...eslintJson};
//   // const userJsonPath: string = options.config || `${process.cwd()}/.eslintrc`;
//   // const userJson = require(userJsonPath) || require(`${process.cwd()}/.eslintrc.json`) || {};
//   // const userRules = userJson.rules || {};
//   // const appRules = eslintConfig.rules || {};
//   // const combinedRules = {...appRules, ...userRules}
//   // const rules: string = JSON.stringify(combinedRules, null, 0);
//   // const elintPath: string = path.resolve(__dirname, './node_modules/eslint/bin/eslint.js');
//   // const eslint = spawnSync(eslintPath, concat(['--rule', rules], args), {
//   //   stdio: 'inherit'
//   // });

//   // if(eslint.stderr) {
//   //   console.error(`child stderr:\n${eslint.stderr}`);
//   //   return;
//   // }

//   // if(eslint.stdout) {
//   //   console.log(`child stdout:\n${eslint.stdout}`);
//   // }
//   // exec('node_modules/eslint/bin/eslint.js ./index.js', (err, stdout, stderr) => {
//   //   if(err) {
//   //     console.error(`exec error: ${err}`);
//   //     return;
//   //   }

//   //   console.log(`Number of files ${stdout}`);
//   // });
// };
