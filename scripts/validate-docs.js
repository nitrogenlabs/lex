import {execFileSync} from 'child_process';
import {transformSync} from 'esbuild';
import {existsSync, readFileSync, readdirSync, statSync} from 'fs';
import {dirname, extname, resolve} from 'path';

const root = process.cwd();
const docs = ['README.md', 'CHANGELOG.md'];

const collectMarkdown = (directory) => {
  for(const entry of readdirSync(directory)) {
    const path = resolve(directory, entry);
    if(statSync(path).isDirectory()) {
      collectMarkdown(path);
    } else if(extname(path) === '.md') {
      docs.push(path.slice(root.length + 1));
    }
  }
};

collectMarkdown(resolve(root, 'examples'));
collectMarkdown(resolve(root, 'src/commands'));

const rootHelp = execFileSync(process.execPath, ['lib/lex.js', '--help'], {encoding: 'utf8'});
const commands = new Set([...rootHelp.matchAll(/^  ([\w-]+)(?:\s|$)/gm)].map((match) => match[1]));
const commandOptions = new Map();
const errors = [];
const lexExports = await import('../lib/index.js');
const documentationCommands = {
  ai: 'ai',
  build: 'build',
  clean: 'clean',
  compile: 'compile',
  config: 'config',
  create: 'create',
  dev: 'dev',
  init: 'init',
  link: 'linked',
  lint: 'lint',
  migrate: 'migrate',
  publish: 'publish',
  'serverless-deploy': 'serverless-deploy',
  'serverless-dev': 'serverless-dev',
  storybook: 'storybook',
  test: 'test',
  update: 'update',
  upgrade: 'upgrade',
  versions: 'versions'
};

for(const command of commands) {
  if(command === 'help') continue;
  const help = execFileSync(process.execPath, ['lib/lex.js', command, '--help'], {encoding: 'utf8'});
  commandOptions.set(command, new Set([...help.matchAll(/--[A-Za-z][\w-]*/g)].map((match) => match[0])));
}

for(const relativePath of docs) {
  const filePath = resolve(root, relativePath);
  const content = readFileSync(filePath, 'utf8');

  for(const match of content.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0].trim();
    if(!target || /^(?:https?:|mailto:)/.test(target)) continue;
    const decodedTarget = decodeURIComponent(target.replace(/^<|>$/g, ''));
    if(!existsSync(resolve(dirname(filePath), decodedTarget))) {
      errors.push(`${relativePath}: broken local link ${match[1]}`);
    }
  }

  for(const match of content.matchAll(/```json\s*\n([\s\S]*?)```/g)) {
    try {
      JSON.parse(match[1]);
    } catch(error) {
      errors.push(`${relativePath}: invalid JSON example (${error.message})`);
    }
  }

  for(const match of content.matchAll(/```(javascript|js|typescript|ts)\s*\n([\s\S]*?)```/g)) {
    try {
      transformSync(match[2], {
        format: 'esm',
        loader: match[1].startsWith('t') ? 'ts' : 'js',
        target: 'es2023'
      });
    } catch(error) {
      const message = error.errors?.[0]?.text || error.message;
      errors.push(`${relativePath}: invalid ${match[1]} example (${message})`);
    }
  }

  for(const match of content.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]@nlabs\/lex['"]/g)) {
    const names = match[1].split(',').map((name) => name.trim().split(/\s+as\s+/)[0]);
    for(const name of names) {
      if(name && !(name in lexExports)) {
        errors.push(`${relativePath}: @nlabs/lex does not export ${name}`);
      }
    }
  }

  if(relativePath.endsWith('.test.md')) {
    for(const match of content.matchAll(/`([\w.-]+\.test\.[jt]sx?)`/g)) {
      if(!existsSync(resolve(dirname(filePath), match[1]))) {
        errors.push(`${relativePath}: referenced test file does not exist: ${match[1]}`);
      }
    }
  }

  const commandDirectory = relativePath.match(/^src\/commands\/([^/]+)\/[^/]+\.docs\.md$/)?.[1];
  const documentedCommand = commandDirectory ? documentationCommands[commandDirectory] : undefined;
  if(documentedCommand) {
    const validOptions = commandOptions.get(documentedCommand) || new Set();
    for(const match of content.matchAll(/(?<![\w])(--[A-Za-z][\w-]*)/g)) {
      if(!validOptions.has(match[1])) {
        errors.push(`${relativePath}: unknown documented option ${match[1]} for lex ${documentedCommand}`);
      }
    }
  }

  for(const [index, line] of content.split('\n').entries()) {
    for(const commandMatch of line.matchAll(/\blex\s+([\w-]+)([^`|]*)/g)) {
      const [, command, remainder] = commandMatch;
      if(!commands.has(command)) {
        errors.push(`${relativePath}:${index + 1}: unknown command lex ${command}`);
        continue;
      }

      const validOptions = commandOptions.get(command) || new Set();
      for(const option of remainder.match(/--[A-Za-z][\w-]*/g) || []) {
        if(!validOptions.has(option)) {
          errors.push(`${relativePath}:${index + 1}: unknown option ${option} for lex ${command}`);
        }
      }
    }
  }
}

if(errors.length > 0) {
  console.error([...new Set(errors)].join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Documentation validation passed for ${docs.length} Markdown files.`);
}
