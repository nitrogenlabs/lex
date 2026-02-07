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
import {resolveBinaryPath} from '../../utils/file.js';
import {log} from '../../utils/log.js';
import {aiFunction} from '../ai/ai.js';

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
  readonly clearCache?: boolean;
  readonly cliName?: string;
  readonly collectCoverageFrom?: string;
  readonly colors?: boolean;
  readonly config?: string;
  readonly debug?: boolean;
  readonly debugTests?: boolean;
  readonly detectOpenHandles?: boolean;
  readonly environment?: string;
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

const defaultExit = ((code?: number) => {
  if(process.env.VITEST || process.env.VITEST_WORKER_ID || process.env.NODE_ENV === 'test') {
    return undefined as never;
  }

  process.exit(code);
}) as typeof process.exit;

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
    ignore: ['**/node_modules/**', '**/dist/**', '**/lib/**', '**/*.test.*', '**/*.spec.*']
  });

  const testFiles = globSync('**/*.{test,spec}.{ts,tsx,js,jsx}', {
    cwd: process.cwd(),
    ignore: ['**/node_modules/**', '**/dist/**', '**/lib/**']
  });

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

export const test = async (
  options: TestOptions,
  args?: string[],
  filesOrCallback?: string[] | TestCallback,
  callbackParam?: TestCallback
): Promise<number> => {
  // Backward-compat argument normalization: allow callback as third param
  let files: string[] | undefined;
  let callback: TestCallback = defaultExit;

  if(typeof filesOrCallback === 'function') {
    callback = filesOrCallback as TestCallback;
  } else {
    files = filesOrCallback as string[] | undefined;
    callback = callbackParam || defaultExit;
  }
  const {
    analyze = false,
    aiAnalyze = false,
    aiDebug = false,
    aiGenerate = false,
    bail,
    changedFilesWithAncestor,
    changedSince,
    ci,
    clearCache,
    cliName = 'Lex',
    collectCoverageFrom,
    colors,
    config,
    debug = false,
    debugTests = false,
    detectOpenHandles,
    environment,
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
          context: true,
          file: targetFile,
          prompt: `Generate Vitest unit tests for this file: ${targetFile}\n\n${readFileSync(targetFile, 'utf-8')}\n\nPlease create comprehensive tests that cover the main functionality. Include test fixtures and mocks where necessary.`,
          quiet,
          task: 'test'
        });

        spinner.succeed(`AI test generation suggestions provided for ${targetFile}`);
      } else {
        spinner.succeed('All source files appear to have corresponding test files');
      }
    } catch(aiError) {
      spinner.fail('Could not generate AI test suggestions');
      if(!quiet) {
        // eslint-disable-next-line no-console
        console.error('AI test generation error:', aiError);
      }
    }
  }

  const projectVitestBin = pathResolve(process.cwd(), 'node_modules/.bin/vitest');
  let vitestPath: string;

  if(existsSync(projectVitestBin)) {
    vitestPath = projectVitestBin;
  } else {
    vitestPath = resolveBinaryPath('vitest');
  }

  if(!vitestPath) {
    log(`\n${cliName} Error: Vitest binary not found in Lex's node_modules or monorepo root`, 'error', quiet);
    log('Please reinstall Lex or check your installation.', 'info', quiet);
    return 1;
  }

  let vitestConfigFile = '';
  let projectVitestConfig: Record<string, unknown> | null = null;

  if(config) {
    vitestConfigFile = config;
  } else {
    const projectVitestConfigPaths = [
      pathResolve(process.cwd(), 'vitest.config.ts'),
      pathResolve(process.cwd(), 'vitest.config.mts'),
      pathResolve(process.cwd(), 'vitest.config.js'),
      pathResolve(process.cwd(), 'vitest.config.mjs'),
      pathResolve(process.cwd(), 'vitest.config.cjs')
    ];
    const existingConfigPath = projectVitestConfigPaths.find((configPath) => existsSync(configPath));

    if(existingConfigPath) {
      vitestConfigFile = existingConfigPath;
      if(debug) {
        log(`Using project Vitest config file: ${vitestConfigFile}`, 'info', quiet);
      }
    } else {
      // No Vitest config file exists in the project
      // Check if there's a Vitest config in lex.config.cjs
      projectVitestConfig = LexConfig.config.vitest;

      const lexDir = LexConfig.getLexDir();
      const lexVitestConfig = pathResolve(lexDir, 'vitest.config.mjs');

      if(debug) {
        log(`Looking for Vitest config at: ${lexVitestConfig}`, 'info', quiet);
        log(`File exists: ${existsSync(lexVitestConfig)}`, 'info', quiet);
      }

      if(existsSync(lexVitestConfig)) {
        vitestConfigFile = lexVitestConfig;
        if(projectVitestConfig && Object.keys(projectVitestConfig).length > 0) {
          if(debug) {
            log(`Using Lex Vitest config with project Vitest config from lex.config.cjs: ${vitestConfigFile}`, 'info', quiet);
          }
        } else if(debug) {
          log(`Using Lex Vitest config (no project Vitest config found): ${vitestConfigFile}`, 'info', quiet);
        }
      } else {
        if(debug) {
          log('No Vitest config found in project or Lex', 'warn', quiet);
        }
      }
    }
  }

  if(showConfig) {
    if(vitestConfigFile) {
      const resolvedConfig = await import(vitestConfigFile);
      log(JSON.stringify(resolvedConfig.default ?? resolvedConfig, null, 2), 'info', quiet);
    } else {
      log(JSON.stringify({test: projectVitestConfig ?? {}}, null, 2), 'info', quiet);
    }
    callback(0);
    return 0;
  }

  const vitestSetupFile: string = setup || pathResolve(process.cwd(), 'vitest.setup.js');
  const vitestArgs: string[] = [];
  const vitestOptions: string[] = [];
  const reporters = new Set<string>();
  const filters: string[] = [];
  const watchMode = Boolean(watch || watchAll);
  const listMode = Boolean(listTests);

  if(listMode) {
    vitestArgs.push('list');
  } else if(watchMode) {
    vitestArgs.push('watch');
  } else {
    vitestArgs.push('run');
  }

  const isESM = detectESM(process.cwd());
  let nodeOptions = process.env.NODE_OPTIONS || '';
  if(isESM) {
    if(!nodeOptions.includes('--experimental-vm-modules')) {
      nodeOptions = `${nodeOptions} --experimental-vm-modules`.trim();
    }
    log('ESM project detected, using --experimental-vm-modules in NODE_OPTIONS', 'info', quiet);
  }

  if(vitestConfigFile) {
    vitestOptions.push('--config', vitestConfigFile);
  }

  if(bail) {
    vitestOptions.push('--bail', '1');
  }

  if(changedFilesWithAncestor) {
    vitestOptions.push('--changed');
  }

  if(changedSince) {
    vitestOptions.push('--changed', changedSince);
  }

  if(ci) {
    vitestOptions.push('--run');
  }

  if(collectCoverageFrom) {
    vitestOptions.push('--coverage', '--coverage.include', collectCoverageFrom);
  }

  if(debug) {
    vitestOptions.push('--inspect');
  }

  if(detectOpenHandles) {
    reporters.add('hanging-process');
  }

  const environmentName = environment || env;
  if(environmentName) {
    vitestOptions.push('--environment', environmentName);
  }

  if(errorOnDeprecated) {
    log('Vitest does not support --errorOnDeprecated; option ignored.', 'warn', quiet);
  }

  if(expand) {
    vitestOptions.push('--expandSnapshotDiff');
  }

  if(forceExit) {
    log('Vitest does not support --forceExit; option ignored.', 'warn', quiet);
  }

  if(lastCommit) {
    vitestOptions.push('--changed');
  }

  if(logHeapUsage) {
    vitestOptions.push('--logHeapUsage');
  }

  if(maxWorkers) {
    vitestOptions.push('--maxWorkers', maxWorkers);
  }

  if(noStackTrace) {
    log('Vitest does not support --noStackTrace; option ignored.', 'warn', quiet);
  }

  if(notify) {
    log('Vitest does not support --notify; option ignored.', 'warn', quiet);
  }

  if(onlyChanged) {
    vitestOptions.push('--changed');
  }

  let tempOutputFile = outputFile;
  const shouldWriteJson = json || useAnalyze || useDebug || Boolean(outputFile);

  if(shouldWriteJson) {
    tempOutputFile = outputFile || '.lex-test-results.json';
    vitestOptions.push('--outputFile', tempOutputFile);
    reporters.add('json');
  }

  if(passWithNoTests) {
    vitestOptions.push('--passWithNoTests');
  }

  if(runInBand) {
    vitestOptions.push('--no-file-parallelism', '--maxWorkers', '1');
  }

  if(silent) {
    vitestOptions.push('--silent');
  }

  if(testLocationInResults) {
    vitestOptions.push('--includeTaskLocation');
  }

  if(testNamePattern) {
    vitestOptions.push('--testNamePattern', testNamePattern);
  }

  if(testPathPattern) {
    filters.push(testPathPattern);
  }

  if(useStderr) {
    log('Vitest does not support --useStderr; option ignored.', 'warn', quiet);
  }

  if(verbose) {
    reporters.add('verbose');
  }

  if(removeCache || clearCache) {
    vitestOptions.push('--clearCache');
  }

  if(update) {
    vitestOptions.push('--update');
  }

  if(watch) {
    filters.push(watch);
  }

  if(args) {
    vitestOptions.push(...args);
  }

  if(files && files.length > 0) {
    filters.push(...files);
  }

  if(reporters.size > 0) {
    const reporterList = Array.from(reporters);
    if(reporterList.includes('json') && !reporterList.includes('verbose')) {
      reporterList.unshift('default');
    }
    reporterList.forEach((reporter) => vitestOptions.push('--reporter', reporter));
  }

  const finalArgs = [...vitestArgs, ...vitestOptions, ...filters];

  if(debug) {
    log(`Vitest options: ${finalArgs.join(' ')}`, 'info', quiet);
    log(`NODE_OPTIONS: ${nodeOptions}`, 'info', quiet);
  }

  try {
    const env: Record<string, string> = {
      ...process.env,
      NODE_OPTIONS: nodeOptions
    };

    if(colors) {
      env.FORCE_COLOR = '1';
    }

    if(ci) {
      env.CI = 'true';
    }

    if(vitestSetupFile && existsSync(vitestSetupFile)) {
      env.LEX_VITEST_SETUP = vitestSetupFile;
    }

    await execa(vitestPath, finalArgs, {
      encoding: 'utf8',
      env,
      stdio: 'inherit'
    });

    spinner.succeed('Testing completed!');

    if(useAnalyze) {
      spinner.start('AI is analyzing test coverage and suggesting improvements...');

      try {
        const testResults = processTestResults(tempOutputFile);
        const filePatterns = getTestFilePatterns(testPathPattern);

        await aiFunction({
          context: true,
          prompt: `Analyze these Vitest test results and suggest test coverage improvements:

${JSON.stringify(testResults, null, 2)}

Test patterns: ${filePatterns.join(', ')}

Please provide:
1. Analysis of current coverage gaps
2. Suggestions for improving test cases
3. Recommendations for additional integration test scenarios
4. Best practices for increasing test effectiveness`,
          quiet,
          task: 'optimize'
        });

        spinner.succeed('AI test analysis complete');
      } catch(aiError) {
        spinner.fail('Could not generate AI test analysis');
        if(!quiet) {
          // eslint-disable-next-line no-console
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
          context: true,
          prompt: `Debug these failed Vitest tests and suggest fixes:

${JSON.stringify(error.message, null, 2)}

Test results: ${JSON.stringify(testResults, null, 2)}

Please provide:
1. Analysis of why the tests are failing
2. Specific suggestions to fix each failing test
3. Any potential issues with test fixtures or mocks
4. Code examples for solutions`,
          quiet,
          task: 'help'
        });

        spinner.succeed('AI debugging assistance complete');
      } catch(aiError) {
        spinner.fail('Could not generate AI debugging assistance');
        if(!quiet) {
          // eslint-disable-next-line no-console
          console.error('AI debugging error:', aiError);
        }
      }
    }

    callback(1);
    return 1;
  }
};

export default test;
