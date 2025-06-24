#!/usr/bin/env node

/**
 * ESLint AI Auto-fixer
 * This script runs ESLint with --fix, then uses Cursor AI to fix remaining issues
 */

import {execa} from 'execa';
import {writeFileSync} from 'fs';
import {resolve as pathResolve, dirname} from 'path';
import {fileURLToPath} from 'url';

// Get directory name
const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = dirname(currentFilename);

// Parse command line arguments
const args = process.argv.slice(2);
const srcDir = args[0] || './src';
const debug = args.includes('--debug');

// Log function
const log = (message, type = 'info') => {
  let prefix = 'ℹ️ ';
  if(type === 'error') {
    prefix = '❌ ';
  } else if(type === 'success') {
    prefix = '✅ ';
  }
  process.stdout.write(`${prefix} ${message}\n`);
};

// Run ESLint with --fix
const runEslintFix = async () => {
  log('Running ESLint with --fix...');
  try {
    await execa('eslint', [srcDir, '--fix'], {stdio: 'inherit'});
    log('ESLint --fix completed', 'success');
    return true;
  } catch(_) {
    log('ESLint found issues that could not be automatically fixed', 'info');
    return false;
  }
};

// Get files with remaining ESLint errors
const getFilesWithErrors = async () => {
  log('Identifying files with remaining ESLint errors...');
  try {
    const {stdout} = await execa('eslint', [srcDir, '--format', 'json']);
    const results = JSON.parse(stdout);

    const filesWithErrors = results
      .filter((result) => result.errorCount > 0)
      .map((result) => result.filePath);

    if(filesWithErrors.length === 0) {
      log('No files with remaining errors found', 'success');
      return [];
    }

    log(`Found ${filesWithErrors.length} files with remaining errors`, 'info');
    return filesWithErrors;
  } catch(_) {
    log('Error identifying files with errors', 'error');
    return [];
  }
};

// Check if Cursor is available
const isCursorAvailable = async () => {
  try {
    await execa('which', ['cursor']);
    return true;
  } catch(_) {
    return false;
  }
};

// Fix file with Cursor AI
const fixFileWithCursorAI = async (filePath) => {
  log(`Fixing ${filePath} with Cursor AI...`);

  try {
    // Create a temporary prompt file
    const promptFile = pathResolve(currentDirname, 'temp_prompt.txt');
    const prompt = `Fix all ESLint errors in this file. Focus on:
1. Fixing naming conventions
2. Fixing sort-keys issues
3. Replacing console.log with log utility
4. Fixing no-plusplus issues
5. Fixing unnecessary escape characters
6. Fixing other ESLint errors`;

    writeFileSync(promptFile, prompt);

    // Use Cursor CLI to fix the file
    await execa('cursor', ['edit', '--file', filePath, '--prompt-file', promptFile]);

    // Clean up
    try {
      await execa('rm', [promptFile]);
    } catch(_) {
      // Ignore cleanup errors
    }

    return true;
  } catch(_) {
    log(`Error fixing ${filePath}`, 'error');
    return false;
  }
};

// Main function
const main = async () => {
  // First run ESLint with --fix
  const eslintFixSucceeded = await runEslintFix();

  // If ESLint fixed everything, we're done
  if(eslintFixSucceeded) {
    log('All ESLint issues fixed!', 'success');
    process.exit(0);
  }

  // Check if Cursor is available
  const cursorAvailable = await isCursorAvailable();
  if(!cursorAvailable) {
    log('Cursor is not available. Install Cursor CLI to enable AI-powered fixes.', 'error');
    log('You can install it from Cursor\'s settings > CLI', 'info');
    process.exit(1);
  }

  // Get files with remaining errors
  const filesWithErrors = await getFilesWithErrors();
  if(filesWithErrors.length === 0) {
    process.exit(0);
  }

  // Fix each file with Cursor AI
  log('Using Cursor AI to fix remaining ESLint errors...');
  let fixedCount = 0;

  const fixResults = await Promise.all(filesWithErrors.map((filePath) => fixFileWithCursorAI(filePath)));
  for(const success of fixResults) {
    if(success) {
      fixedCount += 1;
    }
  }

  log(`Fixed ${fixedCount}/${filesWithErrors.length} files with Cursor AI`, 'success');

  // Run ESLint again to verify fixes
  log('Running ESLint again to verify fixes...');
  try {
    await execa('eslint', [srcDir], {stdio: 'inherit'});
    log('All issues fixed!', 'success');
    process.exit(0);
  } catch(_) {
    log('Some issues remain. You may need to fix them manually.', 'info');
    process.exit(1);
  }
};

// Run the script
main().catch((err) => {
  log(`Unhandled error: ${err.message}`, 'error');
  if(debug) {
    process.stderr.write(`${err}\n`);
  }
  process.exit(1);
});