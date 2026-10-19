import {existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';

import {LexConfig} from '../../LexConfig.js';
import * as app from '../../utils/app.js';
import * as file from '../../utils/file.js';
import * as logging from '../../utils/log.js';
import {create} from './create.js';

const originalCwd = process.cwd();
const originalConfig = LexConfig.config;
let fixture: string;
let owner: string;
let project: string;
let errors: string[];

beforeEach(() => {
  fixture = mkdtempSync(join(tmpdir(), 'lex-create-behavior-'));
  owner = join(fixture, 'owner');
  project = join(fixture, 'project');
  errors = [];
  mkdirSync(join(owner, 'lib/utils'), {recursive: true});
  mkdirSync(project);
  project = realpathSync(project);
  writeFileSync(join(project, 'package.json'), '{}');
  vi.spyOn(LexConfig, 'parseConfig').mockResolvedValue(undefined);
  vi.spyOn(LexConfig, 'getLexDir').mockReturnValue(owner);
  vi.spyOn(file, 'getDirName').mockReturnValue(join(owner, 'lib/utils'));
  vi.spyOn(logging, 'log').mockImplementation((message, level) => {
    if(level === 'error') {
      errors.push(message);
    }
  });
  LexConfig.config = {outputPath: './lib', sourcePath: './src', useTypescript: false};
  process.chdir(project);
});

afterEach(() => {
  process.chdir(originalCwd);
  LexConfig.config = originalConfig;
  vi.restoreAllMocks();
  rmSync(fixture, {force: true, recursive: true});
});

const templatePath = (name: string): string => join(
  owner, 'templates', LexConfig.config.useTypescript ? 'typescript' : 'flow', name
);

const writeTemplate = (name: string, content: string): void => {
  const target = templatePath(name);
  mkdirSync(dirname(target), {recursive: true});
  writeFileSync(target, content);
};

const invoke = async (type: string) => {
  const statuses: number[] = [];
  const result = await create(type, {outputName: 'feature', quiet: true}, (status) => {
    statuses.push(status);
  });
  return {result, statuses};
};

test.each([
  {extension: '.js', typescript: false},
  {extension: '.ts', typescript: true}
])('creates renamed $extension store source and test files', async ({extension, typescript}) => {
  LexConfig.config.useTypescript = typescript;
  writeFileSync(join(owner, 'tsconfig.template.json'), '{"compilerOptions":{"strict":true}}');
  writeTemplate(`.SampleStore/SampleStore${extension}.txt`, 'export const SampleStore = "sample";\n');
  writeTemplate(`.SampleStore/SampleStore.test${extension}.txt`, 'export const name = "Sample sample";\n');
  const outcome = await invoke('store');

  expect(outcome).toEqual({result: 0, statuses: [0]});
  expect(readFileSync(join(project, `FeatureStore/FeatureStore${extension}`), 'utf8'))
    .toBe('export const FeatureStore = "feature";\n');
  expect(readFileSync(join(project, `FeatureStore/FeatureStore.test${extension}`), 'utf8'))
    .toBe('export const name = "Feature feature";\n');
  expect(existsSync(join(project, '.SampleStore'))).toBe(false);
  expect(errors).toEqual([]);

  if(typescript) {
    expect(JSON.parse(readFileSync(join(project, 'tsconfig.json'), 'utf8')))
      .toEqual({compilerOptions: {strict: true}});
  } else {
    expect(existsSync(join(project, 'tsconfig.json'))).toBe(false);
  }
});

test('creates renamed view source, styles and test files', async () => {
  writeTemplate('.SampleView/SampleView.js.txt', 'export const SampleView = "sample";\n');
  writeTemplate('.SampleView/SampleView.test.js.txt', 'export const name = "Sample sample";\n');
  writeTemplate('.SampleView/sampleView.css', '.sampleView { color: red; }\n');
  const outcome = await invoke('view');

  expect(outcome).toEqual({result: 0, statuses: [0]});
  expect(readFileSync(join(project, 'FeatureView/FeatureView.js'), 'utf8'))
    .toBe('export const FeatureView = "feature";\n');
  expect(readFileSync(join(project, 'FeatureView/FeatureView.test.js'), 'utf8'))
    .toBe('export const name = "Feature feature";\n');
  expect(readFileSync(join(project, 'FeatureView/featureView.css'), 'utf8'))
    .toBe('.featureView { color: red; }\n');
  expect(existsSync(join(project, '.SampleView'))).toBe(false);
  expect(errors).toEqual([]);
});

test.each([
  {main: true, testFile: false},
  {main: false, testFile: true}
])('copies only available datalayer templates: $main/$testFile', async ({main, testFile}) => {
  if(main) {
    writeTemplate('DataLayer.js.txt', 'export class DataLayer {}\n');
  }
  if(testFile) {
    writeTemplate('DataLayer.test.js.txt', 'export const name = "DataLayer";\n');
  }
  const outcome = await invoke('datalayer');

  expect(outcome).toEqual({result: 0, statuses: [0]});
  expect(readdirSync(join(project, 'FeatureDataLayer')))
    .toEqual(main ? ['FeatureDataLayer.js'] : ['FeatureDataLayer.test.js']);
  expect(readFileSync(join(project, 'FeatureDataLayer', main ? 'FeatureDataLayer.js' : 'FeatureDataLayer.test.js'), 'utf8'))
    .toBe(main ? 'export class Feature {}\n' : 'export const name = "Feature";\n');
  expect(errors).toEqual([]);
});

test.each(['store', 'view', 'datalayer'])('rejects an unavailable %s filename plan without output', async (type) => {
  vi.spyOn(app, 'getFilenames').mockReturnValue(undefined);
  const {result} = await invoke(type);

  expect(result).toBe(1);
  expect(readdirSync(project)).toEqual(['package.json']);
});

test.each([
  {directory: 'FeatureStore', type: 'store'},
  {directory: 'FeatureView', type: 'view'},
  {directory: 'FeatureDataLayer', type: 'datalayer'}
])('preserves an existing $type directory and reports failure', async ({directory, type}) => {
  const output = join(project, directory);
  mkdirSync(output);
  writeFileSync(join(output, 'keep.txt'), 'existing user content');
  const outcome = await invoke(type);

  expect(outcome).toEqual({result: 1, statuses: [1]});
  expect(readdirSync(output)).toEqual(['keep.txt']);
  expect(readFileSync(join(output, 'keep.txt'), 'utf8')).toBe('existing user content');
  expect(errors).toEqual([expect.stringContaining(`Directory, ${output} already exists.`)]);
});

test.each([
  {code: 'ENOENT', directory: 'FeatureStore', type: 'store'},
  {code: 'ENOENT', directory: 'FeatureView', type: 'view'},
  {code: 'EISDIR', directory: 'FeatureDataLayer', type: 'datalayer'}
])('reports a real filesystem failure while creating $type', async ({code, directory, type}) => {
  if(type === 'datalayer') {
    mkdirSync(templatePath('DataLayer.js.txt'), {recursive: true});
  }
  const outcome = await invoke(type);

  expect(outcome).toEqual({result: 1, statuses: [1]});
  expect(errors).toHaveLength(1);
  expect(errors[0]).toContain(`Cannot create new ${type}.`);
  expect(errors[0]).toContain(code);
  expect(existsSync(join(project, directory, `${directory}.js`))).toBe(false);
});
