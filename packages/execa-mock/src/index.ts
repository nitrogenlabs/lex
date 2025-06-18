/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import childProcess from 'child_process';
import crossSpawn from 'cross-spawn';
import _getStream from 'get-stream';
import {isStream} from 'is-stream';
import {npmRunPathEnv} from 'npm-run-path';
import {onExit} from 'signal-exit';
import stripEof from 'strip-eof';
import util from 'util';

interface MockResult {
  stdout?: string;
  stderr?: string;
  code?: number;
}

interface ParsedOptions extends ExecaOptions {
  cleanup: boolean;
  encoding: string;
  maxBuffer: number;
  preferLocal: boolean;
  reject: boolean;
  stripEof: boolean;
  __winShell?: boolean;
  windowsVerbatimArguments?: boolean;
  shell?: string;
}

interface ParsedCommand {
  args?: string[];
  command?: string;
  file?: string;
  options: ParsedOptions;
  original?: string;
}

interface ExecaOptions extends Record<string, unknown> {
  cleanup?: boolean;
  encoding?: string;
  input?: string | NodeJS.ReadableStream;
  maxBuffer?: number;
  preferLocal?: boolean;
  reject?: boolean;
  stripEof?: boolean;
}

interface ExecaError extends Error {
  code?: number;
  killed?: boolean;
  stdout?: string | null;
  stderr?: string | null;
  failed?: boolean;
  signal?: string | null;
  cmd: string;
}

interface ProcessResult {
  code: number;
  err?: ExecaError;
  signal: string | null;
}

const TEN_MEGABYTES = 1000 * 1000 * 10;
let mockResults: MockResult[] = [];

const getMockCommand = () => {
  const {stdout = '', stderr = '', code = 0} = mockResults.shift() || {};
  return `echo "${stdout.replace('"', '\\"')}"; (>&2 echo ${stderr.replace('"', '\\"')}); exit ${code};`;
};

const handleArgs = (cmd: string, args: string[], opts: Record<string, unknown>) => {
  let parsed: ParsedCommand = {
    args: [],
    command: cmd,
    options: {
      cleanup: true,
      encoding: 'utf8',
      maxBuffer: TEN_MEGABYTES,
      preferLocal: true,
      reject: true,
      stripEof: true
    },
    original: cmd
  };

  if(opts && opts.__winShell === true) {
    delete opts.__winShell;
    parsed = {
      args,
      command: cmd,
      file: cmd,
      options: {
        cleanup: true,
        encoding: 'utf8',
        maxBuffer: TEN_MEGABYTES,
        preferLocal: true,
        reject: true,
        stripEof: true,
        ...opts
      } as ParsedOptions,
      original: cmd
    };
  } else {
    parsed = crossSpawn._parse(cmd, args, opts);
  }

  if(opts.preferLocal) {
    opts.env = npmRunPathEnv(opts);
  }

  return {args: parsed.args, cmd: parsed.command, opts: parsed.options};
};

const handleInput = (spawned: childProcess.ChildProcess, opts: ExecaOptions) => {
  const {input} = opts;

  if(input === null || input === undefined) {
    return;
  }

  if(isStream(input)) {
    input.pipe(spawned.stdin as NodeJS.WritableStream);
  } else {
    spawned.stdin?.end(input);
  }
};

const handleOutput = (opts, val) => (val && opts.stripEof ? stripEof(val) : val);

const handleShell = (fn, cmd, opts) => {
  let file: string = '/bin/sh';
  let args: string[] = ['-c', cmd];
  const updatedOpts = {...opts};

  if(process.platform === 'win32') {
    updatedOpts.__winShell = true;
    file = process.env.comspec || 'cmd.exe';
    args = ['/s', '/c', `"${cmd}"`];
    updatedOpts.windowsVerbatimArguments = true;
  }

  if(updatedOpts.shell) {
    file = updatedOpts.shell;
    delete updatedOpts.shell;
  }

  return fn(file, args, updatedOpts);
};

const getStream = (process, stream, encoding, maxBuffer) => {
  if(!process[stream]) {
    return null;
  }

  const ret = _getStream(process[stream], {maxBuffer});

  return ret.catch((err) => {
    err.stream = stream;
    err.message = `${stream} ${err.message}`;
    throw err;
  });
};

const processDone = (spawned) => new Promise((resolve) => {
  spawned.on('exit', (code, signal) => {
    resolve({code, signal});
  });

  spawned.on('error', (err) => {
    resolve({err});
  });
});

module.exports = jest.fn((cmd, args, opts) => {
  let joinedCmd = cmd;

  if(Array.isArray(args) && args.length > 0) {
    joinedCmd += ` ${args.join(' ')}`;
  }

  const mockCmd = getMockCommand();
  const parsed = handleArgs(mockCmd, args, opts);
  const {encoding, maxBuffer} = parsed.opts;

  let spawned;
  try {
    spawned = childProcess.exec(parsed?.cmd || '', parsed.opts);
  } catch(err) {
    return Promise.reject(err);
  }

  let removeExitHandler;
  if(parsed.opts.cleanup) {
    removeExitHandler = onExit(() => {
      spawned.kill();
    });
  }

  const promise = Promise.all([
    processDone(spawned),
    getStream(spawned, 'stdout', encoding, maxBuffer),
    getStream(spawned, 'stderr', encoding, maxBuffer)
  ]).then((arr) => {
    const result = arr[0] as ProcessResult;
    const stdout = arr[1];
    const stderr = arr[2];
    const {code, err, signal} = result;

    if(removeExitHandler) {
      removeExitHandler();
    }

    if(err || code !== 0 || signal !== null) {
      let error: ExecaError;
      if(!err) {
        error = new Error(`Command failed: ${joinedCmd}\n${stderr}${stdout}`) as ExecaError;
        error.code = code;
      } else {
        error = err as ExecaError;
      }

      error.killed = error.killed || spawned.killed;
      error.stdout = stdout;
      error.stderr = stderr;
      error.failed = true;
      error.signal = signal || null;
      error.cmd = joinedCmd;

      if(!parsed.opts.reject) {
        return error;
      }

      throw error;
    }

    return {
      cmd: joinedCmd,
      code: 0,
      failed: false,
      killed: false,
      signal: null,
      stderr: handleOutput(parsed.opts, stderr),
      stdout: handleOutput(parsed.opts, stdout)
    };
  });

  crossSpawn._enoent.hookChildProcess(spawned, parsed);

  handleInput(spawned, parsed.opts);

  spawned.then = promise.then.bind(promise);
  spawned.catch = promise.catch.bind(promise);

  return spawned;
});

// TODO: set `stderr: 'ignore'` when that option is implemented
module.exports.stdout = jest.fn((...args) => module.exports.apply(null, args).then((results) => results.stdout));

// TODO: set `stdout: 'ignore'` when that option is implemented
module.exports.stderr = jest.fn((...args) => module.exports.apply(null, ...args).then((results) => results.stderr));

module.exports.shell = jest.fn((cmd, opts) => handleShell(module.exports, cmd, opts));

module.exports.sync = jest.fn((cmd, args, opts) => {
  const mockCmd = getMockCommand();
  const parsed = handleArgs(mockCmd, args, opts);

  if(isStream(parsed.opts.input)) {
    throw new TypeError('The `input` option cannot be a stream in sync mode');
  }

  const result = childProcess.exec(parsed?.cmd || '', parsed.opts);

  result.stdout = handleOutput(parsed.opts, result.stdout);
  result.stderr = handleOutput(parsed.opts, result.stderr);

  return result;
});

module.exports.shellSync = jest.fn((mockCmd, opts) => handleShell(module.exports.sync, mockCmd, opts));

module.exports.spawn = jest.fn(util.deprecate(module.exports, 'execa.spawn() is deprecated. Use execa() instead.'));

module.exports.__setMockResults = (results = []) => {
  mockResults = results.map((result) => {
    let stdout = '';
    let stderr = '';
    let code = 0;

    if(typeof result === 'string') {
      stdout = result;
    } else if(Array.isArray(result)) {
      stdout = result[0];
      stderr = (typeof result[1] === 'number' ? '' : result[1]);
      code = (typeof result[1] === 'number' ? result[1] : result[2]);
    } else {
      return result;
    }

    return {code, stderr, stdout};
  });
};
