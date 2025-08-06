/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {execa} from 'execa';
import {existsSync, lstatSync, readdirSync} from 'fs';
import {sync as globSync} from 'glob';
import {extname as pathExtname, join as pathJoin, resolve as pathResolve} from 'path';

import {LexConfig, getTypeScriptConfigPath} from '../../LexConfig.js';
import {checkLinkedModules, copyConfiguredFiles, copyFiles, createSpinner, getFilesByExt, removeFiles} from '../../utils/app.js';
import {getDirName, resolveBinaryPath} from '../../utils/file.js';
import {log} from '../../utils/log.js';

export const hasFileType = (startPath: string, ext: string[]): boolean => {
  if(!existsSync(startPath)) {
    return false;
  }

  const files: string[] = readdirSync(startPath);

  return files.some((file: string) => {
    const filename: string = pathJoin(startPath, file);
    const fileExt: string = pathExtname(filename);
    const stat = lstatSync(filename);

    if(stat.isDirectory()) {
      return hasFileType(filename, ext);
    }

    return ext.includes(fileExt);
  });
};

export const compile = async (cmd: any, callback: any = () => ({})): Promise<number> => {
  const {
    cliName = 'Lex',
    config,
    outputPath,
    quiet,
    remove,
    sourcePath,
    watch
  } = cmd;

  const spinner = createSpinner(quiet);

  log(`${cliName} compiling...`, 'info', quiet);

  await LexConfig.parseConfig(cmd);

  const {outputFullPath, sourceFullPath, useTypescript} = LexConfig.config;
  const outputDir: string = outputPath || outputFullPath;
  const sourceDir: string = sourcePath ? pathResolve(process.cwd(), `./${sourcePath}`) : sourceFullPath || '';
  const dirName = getDirName();
  const dirPath: string = pathResolve(dirName, '../..');

  checkLinkedModules();

  if(remove) {
    await removeFiles(outputDir);
  }

  if(useTypescript) {
    LexConfig.checkCompileTypescriptConfig();

    const typescriptPath: string = resolveBinaryPath('tsc', 'typescript');

    if(!typescriptPath) {
      log(`\n${cliName} Error: TypeScript binary not found in Lex's node_modules or monorepo root`, 'error', quiet);
      log('Please reinstall Lex or check your installation.', 'info', quiet);
      return 1;
    }

    const typescriptOptions: string[] = config ?
      ['-p', config] :
      ['-p', getTypeScriptConfigPath('tsconfig.build.json')];

    spinner.start('Static type checking with Typescript...');

    try {
      await execa(typescriptPath, typescriptOptions, {encoding: 'utf8'});

      spinner.succeed('Successfully completed type checking!');
    } catch (error) {
      log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

      spinner.fail('Type checking failed.');

      callback(1);
      return 1;
    }
  }

  const globOptions = {
    cwd: sourceDir,
    dot: false,
    nodir: true,
    nosort: true
  };
  const tsFiles: string[] = globSync(`${sourceDir}/**/!(*.spec|*.test|*.integration).ts*`, globOptions);
  const jsFiles: string[] = globSync(`${sourceDir}/**/!(*.spec|*.test|*.integration).js`, globOptions);
  const sourceFiles: string[] = [...tsFiles, ...jsFiles];
  const esbuildConfig = LexConfig.config.esbuild || {};
  const isProduction = process.env.NODE_ENV === 'production';
  let shouldMinify: boolean;

  if(typeof esbuildConfig.minify === 'boolean') {
    shouldMinify = esbuildConfig.minify;
  } else {
    shouldMinify = isProduction;
  }

  const esbuildPath: string = resolveBinaryPath('esbuild', 'esbuild');

  if(!esbuildPath) {
    log(`\n${cliName} Error: esbuild binary not found in Lex's node_modules or monorepo root`, 'error', quiet);
    log('Please reinstall Lex or check your installation.', 'info', quiet);
    return 1;
  }

  const esbuildOptions: string[] = [
    ...sourceFiles,
    '--color=true',
    `--format=${esbuildConfig.format || 'esm'}`,
    `--outdir=${outputDir}`,
    `--platform=${esbuildConfig.platform || 'node'}`,
    `--sourcemap=${esbuildConfig.sourcemap || 'inline'}`,
    `--target=${esbuildConfig.target || 'node20'}`
  ];

  if(shouldMinify) {
    esbuildOptions.push('--minify');
  }

  if(esbuildConfig.treeShaking !== false) {
    esbuildOptions.push('--tree-shaking=true');
  }

  if(esbuildConfig.drop && esbuildConfig.drop.length > 0) {
    esbuildConfig.drop.forEach((item) => {
      esbuildOptions.push(`--drop:${item}`);
    });
  }

  if(esbuildConfig.pure && esbuildConfig.pure.length > 0) {
    esbuildConfig.pure.forEach((item) => {
      esbuildOptions.push(`--pure:${item}`);
    });
  }

  if(esbuildConfig.legalComments) {
    esbuildOptions.push(`--legal-comments=${esbuildConfig.legalComments}`);
  }

  if(esbuildConfig.banner) {
    Object.entries(esbuildConfig.banner).forEach(([type, content]) => {
      esbuildOptions.push(`--banner:${type}=${content}`);
    });
  }

  if(esbuildConfig.footer) {
    Object.entries(esbuildConfig.footer).forEach(([type, content]) => {
      esbuildOptions.push(`--footer:${type}=${content}`);
    });
  }

  if(esbuildConfig.define) {
    Object.entries(esbuildConfig.define).forEach(([key, value]) => {
      esbuildOptions.push(`--define:${key}=${value}`);
    });
  }

  if(watch) {
    esbuildOptions.push('--watch');
  }

  const cssFiles: string[] = getFilesByExt('.css', LexConfig.config);

  if(cssFiles.length) {
    const postcssPath: string = resolveBinaryPath('postcss', 'postcss-cli');

    if(!postcssPath) {
      log(`\n${cliName} Error: PostCSS binary not found in Lex's node_modules or monorepo root`, 'error', quiet);
      log('Please reinstall Lex or check your installation.', 'info', quiet);
      return 1;
    }

    const postcssOptions: string[] = [
      `${sourceDir}/**/**.css`,
      '--base',
      sourceDir,
      '--dir',
      outputDir,
      '--config',
      pathResolve(dirName, '../../postcss.config.js')
    ];

    try {
      await execa(postcssPath, postcssOptions, {encoding: 'utf8'});
      spinner.succeed(`Successfully formatted ${cssFiles.length} css files!`);
    } catch (error) {
      log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

      spinner.fail('Failed formatting css.');

      callback(1);
      return 1;
    }
  }

  const gifFiles: string[] = getFilesByExt('.gif', LexConfig.config);
  const jpgFiles: string[] = getFilesByExt('.jpg', LexConfig.config);
  const pngFiles: string[] = getFilesByExt('.png', LexConfig.config);
  const svgFiles: string[] = getFilesByExt('.svg', LexConfig.config);
  const imageFiles: string[] = [...gifFiles, ...jpgFiles, ...pngFiles, ...svgFiles];

  if(imageFiles.length) {
    try {
      await copyFiles(imageFiles, 'image', spinner, LexConfig.config);
    } catch (error) {
      log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

      spinner.fail('Failed to move images to output directory.');

      callback(1);
      return 1;
    }
  }

  const ttfFiles: string[] = getFilesByExt('.ttf', LexConfig.config);
  const otfFiles: string[] = getFilesByExt('.otf', LexConfig.config);
  const woffFiles: string[] = getFilesByExt('.woff', LexConfig.config);
  const woff2Files: string[] = getFilesByExt('.woff2', LexConfig.config);
  const fontFiles: string[] = [...ttfFiles, ...otfFiles, ...woffFiles, ...woff2Files];

  if(fontFiles.length) {
    try {
      await copyFiles(fontFiles, 'font', spinner, LexConfig.config);
    } catch (error) {
      log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

      spinner.fail('Failed to move fonts to output directory.');

      callback(1);
      return 1;
    }
  }

  const mdFiles: string[] = getFilesByExt('.md', LexConfig.config);

  if(mdFiles.length) {
    try {
      await copyFiles(mdFiles, 'documents', spinner, LexConfig.config);
    } catch (error) {
      log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

      spinner.fail('Failed to move docs to output directory.');

      callback(1);
      return 1;
    }
  }

  spinner.start(watch ? 'Watching for changes...' : 'Compiling with ESBuild...');

  try {
    await execa(esbuildPath, esbuildOptions, {encoding: 'utf8'});

    spinner.succeed('Compile completed successfully!');
  } catch (error) {
    log(`\n${cliName} Error: ${error.message}`, 'error', quiet);

    if(!quiet) {
      console.error(error);
    }

    spinner.fail('Code compiling failed.');

    callback(1);
    return 1;
  }

  try {
    await copyConfiguredFiles(spinner, LexConfig.config, quiet);
  } catch (copyError) {
    log(`\n${cliName} Error: Failed to copy configured files: ${copyError.message}`, 'error', quiet);

    spinner.fail('Failed to copy configured files.');

    callback(1);
    return 1;
  }

  callback(0);
  return 0;
};