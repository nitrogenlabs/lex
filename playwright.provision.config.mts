import {defineConfig} from '@playwright/test';

import base from './playwright.config.js';

export default defineConfig({...base, retries: 0, testMatch: '**/provision.e2e.ts'});
