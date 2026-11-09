import {expect, test} from '@nlabs/lex/test-playwright';

import type {APIRequestContext, Page, TestInfo} from '@nlabs/lex/test-playwright';

const extended = test.extend<{ownerSubject: string}>({ownerSubject: ['original-owner', {option: true}]});

extended('public runner retains assertion identity and typed fixture callback inference', async ({ownerSubject, request}, info) => {
  const context: APIRequestContext = request;
  const testInfo: TestInfo = info;
  const subject: string = ownerSubject;
  expect(subject).toBe('original-owner');
  expect(typeof context.get).toBe('function');
  expect(testInfo.retry).toBe(0);
});

const typedPage = (page: Page): string => page.url();
void typedPage;
