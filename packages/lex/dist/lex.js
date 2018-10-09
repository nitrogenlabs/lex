#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var commander_1 = __importDefault(require("commander"));
var commands_1 = require("./commands");
var packageConfig = require('../package.json');
commander_1.default.command('build')
    .option('-b, --babel <path>', 'Babel configuration file path (ie. .babelrc).')
    .option('-c, --config <path>', 'Custom Webpack configuration file path (ie. webpack.config.js).')
    .option('-l, --lexConfig <path>', 'Lex configuration file path (lex.config.js).')
    .option('-m, --mode <type>', 'Webpack mode ("production" or "development"). Default: "development".', /^(development|production)$/i, 'development')
    .option('-q, --quiet', 'No Lex notifications printed in the console.')
    .option('-r, --remove', 'Removes all files from the output directory before compiling.')
    .option('-s, --static', 'Creates static HTML files when building app.')
    .option('-t, --typescript', 'Transpile as Typescript.')
    .option('-v, --variables <name>', 'Environment variables to set in "process.env". (ie. "{NODE_ENV: \'production\'}").')
    .option('--babelPlugins <list>', 'Add Babel plugins (ie. transform-runtime,transform-es2015-modules-amd).')
    .option('--babelPresets <list>', 'Add Babel presets (ie. es2015,react).')
    .option('--sourcePath <path>', 'Source path')
    .option('--outputPath <path>', 'Output path')
    .action(commands_1.build);
commander_1.default.command('clean')
    .option('-q, --quiet', 'No Lex notifications printed in the console.')
    .option('-s, --snapshots', 'Remove all "__snapshots__" directories.')
    .action(commands_1.clean);
commander_1.default.command('compile')
    .option('-b, --babel <path>', 'Babel configuration file path (ie. .babelrc).')
    .option('-c, --config <path>', 'Transpiler configuration file path (ie. .flowconfig or tsconfig.json).')
    .option('-e, --environment <name>', 'Target environment. "node" or "web". Default: "node".')
    .option('-l, --lexConfig <path>', 'Custom Lex configuration file path (ie. lex.config.js).')
    .option('-r, --remove', 'Removes all files from the output directory before compiling.')
    .option('-t, --typescript', 'Transpile as Typescript.')
    .option('-q, --quiet', 'No Lex notifications printed in the console.')
    .option('-w, --watch', 'Watches for changes and compiles.')
    .option('--babelPlugins <list>', 'Add Babel plugins (ie. transform-runtime,transform-es2015-modules-amd).')
    .option('--babelPresets <list>', 'Add Babel presets (ie. es2015,react).')
    .option('--sourcePath <path>', 'Source path')
    .option('--outputPath <path>', 'Output path')
    .action(commands_1.compile);
commander_1.default.command('create <type>')
    .option('-q, --quiet', 'No Lex notifications printed in the console.')
    .option('--outputFile <path>', 'Output filename')
    .action(commands_1.create);
commander_1.default.command('dev')
    .option('-b, --babel <path>', 'Babel configuration file path (ie. .babelrc).')
    .option('-c, --config <path>', 'Custom Webpack configuration file path (ie. webpack.config.js).')
    .option('-l, --lexConfig <path>', 'Custom Lex configuration file path (ie. lex.config.js).')
    .option('-o, --open', 'Automatically open dev server in a new browser window.')
    .option('-q, --quiet', 'No Lex notifications printed in the console.')
    .option('-r, --remove', 'Removes all files from the output directory before compiling.')
    .option('-t, --typescript', 'Transpile as Typescript.')
    .option('-v, --variables <name>', 'Environment variables to set in "process.env". (ie. "{NODE_ENV: \'development\'}").')
    .option('--babelPlugins <list>', 'Add Babel plugins (ie. transform-runtime,transform-es2015-modules-amd).')
    .option('--babelPresets <list>', 'Add Babel presets (ie. es2015,react).')
    .option('--sourcePath <path>', 'Source path')
    .option('--outputPath <path>', 'Output path')
    .action(commands_1.dev);
commander_1.default.command('init <appName> [packageName]')
    .option('-i, --install', 'Install dependencies.')
    .option('-m, --package-manager <manager>', 'Which package manager to use. Default: yarn', /^(npm|yarn)$/i, 'yarn')
    .option('-q, --quiet', 'No Lex notifications printed in the console.')
    .option('-t, --typescript', 'Use a Typescript based app.')
    .action(commands_1.init);
commander_1.default.command('linked')
    .option('-q, --quiet', 'No Lex notifications printed in the console.')
    .action(commands_1.linked);
commander_1.default.command('publish')
    .option('-b, --bump <type>', 'Increments the version. Types include: major, minor, patch, beta, alpha, rc. Default: "patch"., ', /^(major|minor|patch|beta|alpha|rc)$/i, 'patch')
    .option('-o, --otp <code>', 'Provide a two-factor code.')
    .option('-q, --quiet', 'No Lex notifications printed in the console.')
    .option('-p, --private', 'Publishes the module as restricted.')
    .option('-m, --package-manager <manager>', 'Which package manager to use. Default: yarn', /^(npm|yarn)$/i, 'yarn')
    .option('-t, --tag <tag>', 'Registers the published package with the given tag.')
    .option('-v, --new-version <versionNumber>', 'Publish as a specific version.')
    .action(commands_1.publish);
commander_1.default.command('test')
    .option('-c, --config <path>', 'Custom Jest configuration file path (ie. jest.config.js).')
    .option('-d, --detectOpenHandles', 'Attempt to collect and print open handles preventing Jest from exiting cleanly')
    .option('-e, --environment <name>', 'Target environment. "node" or "web". Default: "node".')
    .option('-l, --lexConfig <path>', 'Custom Lex configuration file path (ie. lex.config.js).')
    .option('-q, --quiet', 'No Lex notifications printed in the console.')
    .option('-r, --removeCache', 'Clear Jest cache.')
    .option('-s, --setup <path>', 'Jest setup file path.')
    .option('-t, --typescript', 'Transpile as Typescript.')
    .option('-u, --update', 'Update snapshots. Runs "jest --updateSnapshots"')
    .option('-w, --watch', 'Watches for changes and tests.')
    .action(commands_1.test);
commander_1.default.command('update')
    .option('-i, --interactive', 'Choose which packages to update.')
    .option('-m, --package-manager <manager>', 'Which package manager to use. Default: yarn', /^(npm|yarn)$/i, 'yarn')
    .option('-q, --quiet', 'No Lex notifications printed in the console.')
    .action(commands_1.update);
commander_1.default.command('upgrade')
    .option('-m, --package-manager <manager>', 'Which package manager to use. Default: yarn', /^(npm|yarn)$/i, 'yarn')
    .option('-q, --quiet', 'No Lex notifications printed in the console.')
    .action(commands_1.upgrade);
commander_1.default.command('versions')
    .option('-j, --json', 'Print the version as a JSON object.')
    .action(commands_1.versions);
commander_1.default
    .version(packageConfig.version)
    .parse(process.argv);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSx3REFBZ0M7QUFFaEMsdUNBQXNIO0FBR3RILElBQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBR2pELG1CQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztLQUNyQixNQUFNLENBQUMsb0JBQW9CLEVBQUUsK0NBQStDLENBQUM7S0FDN0UsTUFBTSxDQUFDLHFCQUFxQixFQUFFLGlFQUFpRSxDQUFDO0tBQ2hHLE1BQU0sQ0FBQyx3QkFBd0IsRUFBRSw4Q0FBOEMsQ0FBQztLQUNoRixNQUFNLENBQUMsbUJBQW1CLEVBQUUsdUVBQXVFLEVBQUUsNkJBQTZCLEVBQUUsYUFBYSxDQUFDO0tBQ2xKLE1BQU0sQ0FBQyxhQUFhLEVBQUUsOENBQThDLENBQUM7S0FDckUsTUFBTSxDQUFDLGNBQWMsRUFBRSwrREFBK0QsQ0FBQztLQUN2RixNQUFNLENBQUMsY0FBYyxFQUFFLDhDQUE4QyxDQUFDO0tBQ3RFLE1BQU0sQ0FBQyxrQkFBa0IsRUFBRSwwQkFBMEIsQ0FBQztLQUN0RCxNQUFNLENBQUMsd0JBQXdCLEVBQUUsb0ZBQW9GLENBQUM7S0FDdEgsTUFBTSxDQUFDLHVCQUF1QixFQUFFLHlFQUF5RSxDQUFDO0tBQzFHLE1BQU0sQ0FBQyx1QkFBdUIsRUFBRSx1Q0FBdUMsQ0FBQztLQUN4RSxNQUFNLENBQUMscUJBQXFCLEVBQUUsYUFBYSxDQUFDO0tBQzVDLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxhQUFhLENBQUM7S0FDNUMsTUFBTSxDQUFDLGdCQUFLLENBQUMsQ0FBQztBQUVqQixtQkFBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUM7S0FDckIsTUFBTSxDQUFDLGFBQWEsRUFBRSw4Q0FBOEMsQ0FBQztLQUNyRSxNQUFNLENBQUMsaUJBQWlCLEVBQUUseUNBQXlDLENBQUM7S0FDcEUsTUFB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