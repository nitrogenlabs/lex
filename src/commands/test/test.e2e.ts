import {expect, test} from '@playwright/test';

test('playwright e2e smoke test runs inside Lex', async ({page}) => {
  await page.setContent(`
    <main>
      <h1>Lex E2E</h1>
      <button type="button">Run</button>
    </main>
  `);

  await expect(page.getByRole('heading', {name: 'Lex E2E'})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Run'})).toBeEnabled();
});
