/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import {existsSync, readFileSync} from 'fs';
import {sync as globSync} from 'glob';
import {resolve as pathResolve} from 'path';

import {LexConfig, getTypeScriptConfigPath} from '../../LexConfig.js';
import {createSpinner} from '../../utils/app.js';
import {getDirName, resolveBinaryPath} from '../../utils/file.js';
import {log} from '../../utils/log.js';
import {aiFunction} from '../ai/ai.js';

/**
 * Detect if the project is using ESM by checking package.json
 */
const detectESM = (cwd: string): boolean => {
  const packageJsonPath = pathResolve(cwd, 'package.json');

  if(existsSync(packageJsonPath)) {
    try {
      const packageJsonContent = readFileSync(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonContent);
      return packageJson.type === 'module';
    } catch(_error) {
      return false;
    }
  }

  return false;
};

export interface TestOptions {
  readonly analyze?: boolean;
  readonly aiDebug?: boolean;
  readonly aiGenerate?: boolean;
  readonly aiAnalyze?: boolean;
  readonly bail?: boolean;
  readonly changedFilesWithAncestor?: boolean;
  readonly changedSince?: string;
  readonly ci?: boolean;
  readonly cliName?: string;
  readonly collectCoverageFrom?: string;
  readonly colors?: boolean;
  readonly config?: string;
  readonly debug?: boolean;
  readonly debugTests?: boolean;
  readonly detectOpenHandles?: boolean;
  readonly env?: string;
  readonly errorOnDeprecated?: boolean;
  readonly expand?: boolean;
  readonly forceExit?: boolean;
  readonly generate?: boolean;
  readonly json?: boolean;
  readonly lastCommit?: boolean;
  readonly listTests?: boolean;
  readonly logHeapUsage?: boolean;
  readonly maxWorkers?: string;
  readonly noStackTrace?: boolean;
  readonly notify?: boolean;
  readonly onlyChanged?: boolean;
  readonly outputFile?: string;
  readonly passWithNoTests?: boolean;
  readonly quiet?: boolean;
  readonly removeCache?: boolean;
  readonly runInBand?: boolean;
  readonly setup?: string;
  readonly showConfig?: boolean;
  readonly silent?: boolean;
  readonly testLocationInResults?: boolean;
  readonly testNamePattern?: string;
  readonly testPathPattern?: string;
  readonly update?: boolean;
  readonly useStderr?: boolean;
  readonly verbose?: boolean;
  readonly watch?: string;
  readonly watchAll?: boolean;
}

export type TestCallback = typeof process.exit;

export const getTestFilePatterns = (testPathPattern?: string): string[] => {
  const defaultPatterns = ['**/*.test.*', '**/*.spec.*', '**/*.integration.*'];

  if(!testPathPattern) {
    return defaultPatterns;
  }

  return [testPathPattern];
};

const findUncoveredSourceFiles = (): string[] => {
  const sourceFiles = globSync('src/**/*.{ts,tsx,js,jsx}', {
    cwd: process.cwd(),
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.*', '**/*.spec.*']
  });

  const testFiles = globSync('**/*.{test,spec}.{ts,tsx,js,jsx}', {
    cwd: process.cwd(),
    ignore: ['**/node_modules/**', '**/dist/**']
  });

  // Simple heuristic to find source files without corresponding test files
  return sourceFiles.filter((sourceFile) => {
    const baseName = sourceFile.replace(/\.[^/.]+$/, '');
    return !testFiles.some((testFile) => testFile.includes(baseName));
  });
};

const processTestResults = (outputFile?: string): any => {
  if(!outputFile) {
    return null;
  }

  try {
    const content = readFileSync(outputFile, 'utf-8');
    return JSON.parse(content);
  } catch(_error) {
    return null;
  }
};

export const test = async (options: TestOptions, args: string[], callback: TestCallback = process.exit): Promise<number> => {
  const {
    analyze = false,
    aiAnalyze = false,
    aiDebug = false,
    aiGenerate = false,
    bail,
    changedFilesWithAncestor,
    changedSince,
    ci,
    cliName = 'Lex',
    collectCoverageFrom,
    colors,
    config,
    debug = false,
    debugTests = false,
    detectOpenHandles,
    env,
    errorOnDeprecated,
    expand,
    forceExit,
    generate = false,
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

  const useGenerate = generate || aiGenerate;
  const useAnalyze = analyze || aiAnalyze;
  const useDebug = debugTests || aiDebug;

  log(`${cliName} testing...`, 'info', quiet);

  const spinner = createSpinner(quiet);

  await LexConfig.parseConfig(options);

  const {useTypescript} = LexConfig.config;

  if(useTypescript) {
    // Use the test-specific TypeScript config for testing
    const testConfigPath = getTypeScriptConfigPath('tsconfig.test.json');
    if(existsSync(testConfigPath)) {
      log('Using tsconfig.test.json for testing...', 'info', quiet);
    } else {
      LexConfig.checkTestTypescriptConfig();
    }
  }

  if(useGenerate) {
    spinner.start('AI is analyzing code to generate test cases...');

    try {
      const uncoveredFiles = findUncoveredSourceFiles();

      if(uncoveredFiles.length > 0) {
        const targetFile = uncoveredFiles[0];

        await aiFunction({
          prompt: `Generate Jest unit tests for this file: ${targetFile}\n\n${readFileSync(targetFile, 'utf-8')}\n\nPlease create comprehensive tests that cover the main functionality. Include test fixtures and mocks where necessary.`,
          task: 'test',
          file: targetFile,
          context: true,
          quiet
        });

        spinner.succeed(`AI test generation suggestions provided for ${targetFile}`);
      } else {
        spinner.succeed('All source files appear to have corresponding test files');
      }
    } catch(aiError) {
      spinner.fail('Could not generate AI test suggestions');
      if(!quiet) {
        console.error('AI test generation error:', aiError);
      }
    }
  }

  const dirName = getDirName();
  const dirPath: string = pathResolve(dirName, '../../..');

  // Use robust path resolution for Jest binary
  const jestPath: string = resolveBinaryPath('jest');

  // Check if Jest binary exists
  if(!jestPath) {
    log(`\n${cliName} Error: Jest binary not found in Lex's node_modules or monorepo root`, 'error', quiet);
    log('Please reinstall Lex or check your installation.', 'info', quiet);
    return 1;
  }
  const jestConfigFile: string = config || pathResolve(dirName, '../../../jest.config.lex.js');
  const jestSetupFile: string = setup || pathResolve(dirName, '../../../jest.setup.js');
  const jestOptions: string[] = ['--no-cache'];

  // Detect if project is using ESM and set NODE_OPTIONS if so
  const isESM = detectESM(process.cwd());
  let nodeOptions = process.env.NODE_OPTIONS || '';
  if(isESM) {
    if(!nodeOptions.includes('--experimental-vm-modules')) {
      nodeOptions = `${nodeOptions} --experimental-vm-modules`.trim();
    }
    log('ESM project detected, using --experimental-vm-modules in NODE_OPTIONS', 'info', quiet);
  }

  jestOptions.push('--config', jestConfigFile);

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

  let tempOutputFile = outputFile;

  if((useAnalyze || useDebug) && !outputFile) {
    tempOutputFile = '.lex-test-results.json';
    jestOptions.push('--json', '--outputFile', tempOutputFile);
  } else if(outputFile) {
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
    jestOptions.push('--testPathPatterns', testPathPattern);
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

  if(removeCache) {
    jestOptions.push('--no-cache');
  }

  if(jestSetupFile && existsSync(jestSetupFile)) {
    jestOptions.push(`--setupFilesAfterEnv=${jestSetupFile}`);
  }

  if(update) {
    jestOptions.push('--updateSnapshot');
  }

  if(watch) {
    jestOptions.push('--watch', watch);
  }

  if(args) {
    jestOptions.push(...args);
  }

  // Debug: Log Jest options for verification
  if(debug) {
    log(`Jest options: ${jestOptions.join(' ')}`, 'info', quiet);
    log(`NODE_OPTIONS: ${nodeOptions}`, 'info', quiet);
  }

  try {
    await execa(jestPath, jestOptions, {
      encoding: 'utf8',
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_OPTIONS: nodeOptions
      }
    });

    spinner.succeed('Testing completed!');

    if(useAnalyze) {
      spinner.start('AI is analyzing test coverage and suggesting improvements...');

      try {
        const testResults = processTestResults(tempOutputFile);
        const filePatterns = getTestFilePatterns(testPathPattern);

        await aiFunction({
          prompt: `Analyze these Jest test results and suggest test coverage improvements:

${JSON.stringify(testResults, null, 2)}

Test patterns: ${filePatterns.join(', ')}

Please provide:
1. Analysis of current coverage gaps
2. Suggestions for improving test cases
3. Recommendations for additional integration test scenarios
4. Best practices for increasing test effectiveness`,
          task: 'optimize',
          context: true,
          quiet
        });

        spinner.succeed('AI test analysis complete');
      } catch(aiError) {
        spinner.fail('Could not generate AI test analysis');
        if(!quiet) {
          console.error('AI analysis error:', aiError);
        }
      }
    }

    callback(0);
    return 0;
  } catch(error) {
    log(`\n${cliName} Error: Check for unit test errors and/or coverage.`, 'error', quiet);

    spinner.fail('Testing failed!');

    if(useDebug) {
      spinner.start('AI is analyzing test failures...');

      try {
        const testResults = processTestResults(tempOutputFile);

        await aiFunction({
          prompt: `Debug these failed Jest tests and suggest fixes:

${JSON.stringify(error.message, null, 2)}

Test results: ${JSON.stringify(testResults, null, 2)}

Please provide:
1. Analysis of why the tests are failing
2. Specific suggestions to fix each failing test
3. Any potential issues with test fixtures or mocks
4. Code examples for solutions`,
          task: 'help',
          context: true,
          quiet
        });

        spinner.succeed('AI debugging assistance complete');
      } catch(aiError) {
        spinner.fail('Could not generate AI debugging assistance');
        if(!quiet) {
          console.error('AI debugging error:', aiError);
        }
      }
    }

    callback(1);
    return 1;
  }
};

export default test;