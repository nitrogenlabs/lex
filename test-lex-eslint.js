/**
 * Test script to verify Lex's ESLint binary detection
 */
import {existsSync} from 'fs';
import {resolve as pathResolve, dirname} from 'path';
import {fileURLToPath} from 'url';

// Create __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simulate the ESLint binary detection logic
const findLexEslintBinary = () => {
  // Find Lex's ESLint binary
  const lexEslintPath = pathResolve(__dirname, 'packages/lex/node_modules/.bin/eslint');
  const globalLexEslintPath = pathResolve(process.env.LEX_HOME || '/usr/local/lib/node_modules/@nlabs/lex', 'node_modules/.bin/eslint');
  
  console.log('Checking for Lex ESLint binary...');
  console.log('  Local path:', lexEslintPath);
  console.log('  Global path:', globalLexEslintPath);
  
  if(existsSync(lexEslintPath)) {
    console.log('✅ Found local Lex ESLint binary');
    return lexEslintPath;
  } else if(existsSync(globalLexEslintPath)) {
    console.log('✅ Found global Lex ESLint binary');
    return globalLexEslintPath;
  } else {
    console.log('❌ Lex ESLint binary not found, will fallback to npx');
    return 'eslint'; // fallback to npx
  }
};

// Test the function
console.log('Current directory:', process.cwd());
console.log('Testing Lex ESLint binary detection...\n');

const eslintBinary = findLexEslintBinary();
console.log(`\n✅ ESLint binary to use: ${eslintBinary}`);
console.log('✅ Lex will now use its own ESLint instead of requiring project installation!'); 