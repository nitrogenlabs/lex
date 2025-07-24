import {existsSync, mkdirSync, writeFileSync, rmSync} from 'fs';
import {join} from 'path';
import {tmpdir} from 'os';

import {processTranslations} from './translations.js';

jest.mock('./log.js', () => ({
  log: jest.fn()
}));

describe('translations', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `lex-translations-test-${Date.now()}`);
    mkdirSync(testDir, {recursive: true});
  });

  afterEach(() => {
    try {
      rmSync(testDir, {recursive: true, force: true});
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should process translation files and create flattened output', async () => {
    // Create test translation files
    const translationsDir = join(testDir, 'src', 'translations');
    mkdirSync(translationsDir, {recursive: true});

    // Create nested translation file
    const enTranslations = {
      auth: {
        signupTitle: 'Sign Up',
        validation: {
          'invalid-email': 'Invalid email address',
          'email-required': 'Email is required'
        }
      },
      common: {
        submit: 'Submit',
        cancel: 'Cancel'
      }
    };

    writeFileSync(join(translationsDir, 'en.json'), JSON.stringify(enTranslations, null, 2));

    // Create another translation file in a different location
    const authTranslationsDir = join(testDir, 'src', 'pages', 'Auth', 'translations');
    mkdirSync(authTranslationsDir, {recursive: true});

    const authEnTranslations = {
      login: {
        title: 'Login',
        email: 'Email',
        password: 'Password'
      }
    };

    writeFileSync(join(authTranslationsDir, 'en.json'), JSON.stringify(authEnTranslations, null, 2));

    // Create output directory
    const outputDir = join(testDir, 'dist');
    mkdirSync(outputDir, {recursive: true});

    // Process translations
    await processTranslations(testDir, outputDir, true);

    // Check if output file was created
    const outputFile = join(outputDir, 'translations.json');
    expect(existsSync(outputFile)).toBe(true);

    // Read and verify the flattened output
    const outputContent = JSON.parse(require('fs').readFileSync(outputFile, 'utf8'));

    expect(outputContent['auth.signupTitle']).toBe('Sign Up');
    expect(outputContent['auth.validation.invalid-email']).toBe('Invalid email address');
    expect(outputContent['auth.validation.email-required']).toBe('Email is required');
    expect(outputContent['common.submit']).toBe('Submit');
    expect(outputContent['common.cancel']).toBe('Cancel');
    expect(outputContent['login.title']).toBe('Login');
    expect(outputContent['login.email']).toBe('Email');
    expect(outputContent['login.password']).toBe('Password');
  });

  it('should handle multiple translation files', async () => {
    // Create test translation files
    const translationsDir = join(testDir, 'src', 'translations');
    mkdirSync(translationsDir, {recursive: true});

    const firstTranslations = {
      hello: 'Hello',
      welcome: 'Welcome'
    };

    const secondTranslations = {
      goodbye: 'Goodbye',
      thanks: 'Thank you'
    };

    writeFileSync(join(translationsDir, 'en.json'), JSON.stringify(firstTranslations, null, 2));
    writeFileSync(join(translationsDir, 'es.json'), JSON.stringify(secondTranslations, null, 2));

    // Create output directory
    const outputDir = join(testDir, 'dist');
    mkdirSync(outputDir, {recursive: true});

    // Process translations
    await processTranslations(testDir, outputDir, true);

    // Check output
    const outputFile = join(outputDir, 'translations.json');
    const outputContent = JSON.parse(require('fs').readFileSync(outputFile, 'utf8'));

    expect(outputContent.hello).toBe('Hello');
    expect(outputContent.welcome).toBe('Welcome');
    expect(outputContent.goodbye).toBe('Goodbye');
    expect(outputContent.thanks).toBe('Thank you');
  });

  it('should handle non-existent source path gracefully', async () => {
    const nonExistentPath = join(testDir, 'non-existent');
    const outputDir = join(testDir, 'dist');
    mkdirSync(outputDir, {recursive: true});

    // Should not throw error
    await expect(processTranslations(nonExistentPath, outputDir, true)).resolves.not.toThrow();
  });

  it('should handle empty source directory', async () => {
    const outputDir = join(testDir, 'dist');
    mkdirSync(outputDir, {recursive: true});

    // Should not throw error
    await expect(processTranslations(testDir, outputDir, true)).resolves.not.toThrow();
  });
});