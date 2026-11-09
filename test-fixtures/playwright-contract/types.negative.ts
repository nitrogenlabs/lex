import {test} from '@nlabs/lex/test-playwright';
import type {PlaywrightTestConfig} from '@nlabs/lex/test-playwright';

// @ts-expect-error Public config preserves the framework's worker-count contract.
const invalid: PlaywrightTestConfig = {workers: {foreign: true}};
// @ts-expect-error Fixture callbacks retain public framework inference.
test('negative callback', async ({missingFixture}) => {void missingFixture;});
void invalid;
