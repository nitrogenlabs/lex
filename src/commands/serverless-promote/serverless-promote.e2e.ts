import {expect, test} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import {chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

interface PromotionState {
  aliases: {dev: string; prod: string};
  published: string[];
}

const exercise = (dryRun: boolean) => {
  const directory = mkdtempSync(join(tmpdir(), 'lex-promote-'));
  const statePath = join(directory, 'state.json');
  const awsPath = join(directory, 'aws');
  writeFileSync(statePath, JSON.stringify({aliases: {dev: '1', prod: '1'}, published: []}));
  writeFileSync(awsPath, `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
const value = flag => args[args.indexOf(flag) + 1];
const state = JSON.parse(fs.readFileSync(process.env.FAKE_AWS_STATE, 'utf8'));
if(value('--function-name') !== 'phantazeApiMessageWebsocket') process.exit(2);
let output;
switch(args[1]) {
  case 'get-alias': output = {FunctionVersion: state.aliases[value('--name')], RevisionId: 'alias-revision'}; break;
  case 'get-function-configuration': output = {CodeSha256: 'bundle-hash', LastUpdateStatus: 'Successful', RevisionId: 'function-revision', State: 'Active'}; break;
  case 'publish-version':
    if(value('--code-sha256') !== 'bundle-hash' || value('--revision-id') !== 'function-revision') process.exit(3);
    state.published.push('2'); output = {Version: '2'}; break;
  case 'wait':
    if(args[2] !== 'function-active-v2' || value('--qualifier') !== '2') process.exit(6);
    process.exit(0);
  case 'update-alias':
    if(value('--revision-id') !== 'alias-revision') process.exit(4);
    state.aliases[value('--name')] = value('--function-version'); output = {FunctionVersion: value('--function-version')}; break;
  default: process.exit(5);
}
fs.writeFileSync(process.env.FAKE_AWS_STATE, JSON.stringify(state));
console.log(JSON.stringify(output));
`);
  chmodSync(awsPath, 0o755);
  try {
    const output = execFileSync(process.execPath, [
      process.env.LEX_PROMOTE_CLI || resolve('lib/lex.js'), 'serverless-promote', '--function-name', 'phantazeApiMessageWebsocket',
      '--alias', 'dev', '--region', 'us-east-1', '--expected-version', '1',
      '--expected-code-sha256', 'bundle-hash', '--expected-revision', 'function-revision',
      ...(dryRun ? ['--dry-run'] : [])
    ], {
      encoding: 'utf8',
      env: {...process.env, FAKE_AWS_STATE: statePath, PATH: `${directory}:${process.env.PATH}`}
    });
    return {output, state: JSON.parse(readFileSync(statePath, 'utf8')) as PromotionState};
  } finally {
    rmSync(directory, {force: true, recursive: true});
  }
};

test('CLI promotes the Phantaze dev target and preserves production', () => {
  const {output, state} = exercise(false);
  expect(state).toEqual({aliases: {dev: '2', prod: '1'}, published: ['2']});
  expect(output).toContain('from version 1 to 2');
});

test('CLI dry run preserves both stage targets', () => {
  const {output, state} = exercise(true);
  expect(state).toEqual({aliases: {dev: '1', prod: '1'}, published: []});
  expect(output).toContain('dry run');
});
