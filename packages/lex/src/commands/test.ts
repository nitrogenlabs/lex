import {execa} from 'execa';

import {resolve as pathResolve} from 'path';

import {URL} from 'url';

import {LexConfig} from '../LexConfig.js';
import {createSpinner} from '../utils/app.js';
import {relativeNodePath} from '../utils/file.js';
import {log} from '../utils/log.js';

export const test = async (options: any, args: string[], callback: any = process.exit): Promise<number> => {
  const {
    bail,
    changedFilesWithAncestor,
    changedSince,
    ci,
    cliName = 'Lex',
    collectCoverageFrom,
    colors,
    config,
    debug,
    detectOpenHandles,
    env,
    errorOnDeprecated,
    expand,
    forceExit,
    json,
    lastCommit,
    listTests,
    logHeapUsage,
    maxWorkers,
    noStackTrace,
    notify,
    onlyChanged,
    outputFile,
    passWithNoTests,
    quiet,
    removeCache,
    runInBand,
    setup,
    showConfig,
    silent,
    testLocationInResults,
    testNamePattern,
    testPathPattern,
    update,
    useStderr,
    verbose,
    watch,
    watchAll
  } = options;

  log(`${cliName} testing...`, 'info', quiet);

  // Spinner
  const spinner = createSpinner(quiet);

  // Get custom configuration
  await LexConfig.parseConfig(options);

  const {jest, useTypescript} = LexConfig.config;

  if(useTypescript) {
    // Make sure tsconfig.json exists
    LexConfig.checkTypescriptConfig();
  }

  // Configure jest
  const dirName = new URL('.', import.meta.url).pathname;
  const dirPath: string = pathResolve(dirName, '../..');
  const jestPath: string = relativeNodePath('jest-cli/bin/jest.js', dirPath);
  const jestConfigFile: string = config || pathResolve(dirName, '../../jest.config.lex.js');
  const jestSetupFile: string = setup || '';
  const jestOptions: string[] = ['--config', jestConfigFile, '--no-cache'];

  if(bail) {
    jestOptions.push('--bail');
  }

  if(changedFilesWithAncestor) {
    jestOptions.push('--changedFilesWithAncestor');
  }

  if(changedSince) {
    jestOptions.push('--changedSince');
  }

  if(ci) {
    jestOptions.push('--ci');
  }

  if(collectCoverageFrom) {
    jestOptions.push('--collectCoverageFrom', collectCoverageFrom);
  }

  if(colors) {
    jestOptions.push('--colors');
  }

  if(debug) {
    jestOptions.push('--debug');
  }

  // Detect open handles
  if(detectOpenHandles) {
    jestOptions.push('--detectOpenHandles');
  }

  if(env) {
    jestOptions.push('--env');
  }

  if(errorOnDeprecated) {
    jestOptions.push('--errorOnDeprecated');
  }

  if(expand) {
    jestOptions.push('--expand');
  }

  if(forceExit) {
    jestOptions.push('--forceExit');
  }

  if(json) {
    jestOptions.push('--json');
  }

  if(lastCommit) {
    jestOptions.push('--lastCommit');
  }

  if(listTests) {
    jestOptions.push('--listTests');
  }

  if(logHeapUsage) {
    jestOptions.push('--logHeapUsage');
  }

  if(maxWorkers) {
    jestOptions.push('--maxWorkers', maxWorkers);
  }

  if(noStackTrace) {
    jestOptions.push('--noStackTrace');
  }

  if(notify) {
    jestOptions.push('--notify');
  }

  if(onlyChanged) {
    jestOptions.push('--onlyChanged');
  }

  if(outputFile) {
    jestOptions.push('--outputFile', outputFile);
  }

  if(passWithNoTests) {
    jestOptions.push('--passWithNoTests');
  }

  if(runInBand) {
    jestOptions.push('--runInBand');
  }

  if(showConfig) {
    jestOptions.push('--showConfig');
  }

  if(silent) {
    jestOptions.push('--silent');
  }

  if(testLocationInResults) {
    jestOptions.push('--testLocationInResults');
  }

  if(testNamePattern) {
    jestOptions.push('--testNamePattern', testNamePattern);
  }

  if(testPathPattern) {
    jestOptions.push('--testPathPattern', testPathPattern);
  }

  if(useStderr) {
    jestOptions.push('--useStderr');
  }

  if(verbose) {
    jestOptions.push('--verbose');
  }

  if(watchAll) {
    jestOptions.push('--watchAll');
  }

  // Clear cache
  if(removeCache) {
    jestOptions.push('--no-cache');
  }

  if(jestSetupFile !== '') {
    const cwd: string = process.cwd();
    jestOptions.push(`--setupFilesAfterEnv=${pathResolve(cwd, jestSetupFile)}`);
  }

  // Update snapshots
  if(update) {
    jestOptions.push('--updateSnapshot');
  }

  if(watch) {
    jestOptions.push('--watch', watch);
  }

  if(args) {
    jestOptions.push(...args);
  }

  try {
    await execa(jestPath, jestOptions, {
      encoding: 'utf8',
      stdio: 'inherit'
    });

    spinner.succeed('Testing completed!');

    // Kill process
    callback(0);
    return 0;
  } catch(error) {
    // Display error message
    log(`\n${cliName} Error: Check for unit test errors and/or coverage.`, 'error', quiet);

    // Stop spinner
    spinner.fail('Testing failed!');

    // Kill process
    callback(1);
    return 1;
  }
};
