import {existsSync, mkdirSync, readFileSync, writeFileSync, rmSync} from 'fs';
import {tmpdir} from 'os';
import {join} from 'path';

import {processTranslations} from './translations.js';

vi.mock('./log.js', async () => ({
  log: vi.fn()
}));

describe('translations', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `lex-translations-test-${Date.now()}`);
    mkdirSync(testDir, {recursive: true});
  });

  afterEach(() => {
    try {
      rmSync(testDir, {force: true, recursive: true});
    } catch{
    }
  });

  it('should process translation files and create flattened output', async () => {
    const translationsDir = join(testDir, 'src', 'translations');
    mkdirSync(translationsDir, {recursive: true});

    const enTranslations = {
      auth: {
        signupTitle: 'Sign Up',
        validation: {
          'email-required': 'Email is required',
          'invalid-email': 'Invalid email address'
        }
      },
      common: {
        cancel: 'Cancel',
        submit: 'Submit'
      }
    };

    writeFileSync(join(translationsDir, 'en.json'), JSON.stringify(enTranslations, null, 2));

    const authTranslationsDir = join(testDir, 'src', 'pages', 'Auth', 'translations');
    mkdirSync(authTranslationsDir, {recursive: true});

    const authEnTranslations = {
      login: {
        email: 'Email',
        password: 'Password',
        title: 'Login'
      }
    };

    writeFileSync(join(authTranslationsDir, 'en.json'), JSON.stringify(authEnTranslations, null, 2));

    const outputDir = join(testDir, 'lib');
    mkdirSync(outputDir, {recursive: true});

    await processTranslations(testDir, outputDir, true);

    const outputFile = join(outputDir, 'translations.json');
    const srcOutputFile = join(testDir, 'src', 'translations.json');

    expect(existsSync(outputFile)).toBe(true);
    expect(existsSync(srcOutputFile)).toBe(true);

    const outputContent = JSON.parse(readFileSync(outputFile, 'utf8'));
    const srcOutputContent = JSON.parse(readFileSync(srcOutputFile, 'utf8'));

    expect(outputContent).toEqual(srcOutputContent);
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
    const outputDir = join(testDir, 'lib');
    mkdirSync(outputDir, {recursive: true});

    // Process translations
    await processTranslations(testDir, outputDir, true);

    const outputFile = join(outputDir, 'translations.json');
    const srcOutputFile = join(testDir, 'src', 'translations.json');

    expect(existsSync(outputFile)).toBe(true);
    expect(existsSync(srcOutputFile)).toBe(true);

    const outputContent = JSON.parse(readFileSync(outputFile, 'utf8'));
    const srcOutputContent = JSON.parse(readFileSync(srcOutputFile, 'utf8'));

    expect(outputContent).toEqual(srcOutputContent);
    expect(outputContent.hello).toBe('Hello');
    expect(outputContent.welcome).toBe('Welcome');
    expect(outputContent.goodbye).toBe('Goodbye');
    expect(outputContent.thanks).toBe('Thank you');
  });

  it('should handle non-existent source path gracefully', async () => {
    const nonExistentPath = join(testDir, 'non-existent');
    const outputDir = join(testDir, 'lib');
    mkdirSync(outputDir, {recursive: true});

    // Should not throw error
    await expect(processTranslations(nonExistentPath, outputDir, true)).resolves.not.toThrow();
  });

  it('should handle empty source directory', async () => {
    const outputDir = join(testDir, 'lib');
    mkdirSync(outputDir, {recursive: true});

    // Should not throw error
    await expect(processTranslations(testDir, outputDir, true)).resolves.not.toThrow();
  });
});