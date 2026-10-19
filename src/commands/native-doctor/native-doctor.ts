import {findNativeExecutable, nativeDirectoryExists, reportNative, runNativeCheck} from '../../utils/native/process.js';

export interface NativeDoctorOptions {
  cwd?: string;
  developerDir?: string;
  platform: 'ios';
  requireBundler?: boolean;
}
export interface NativeDoctorDependencies {
  env: NodeJS.ProcessEnv;
  exists: (path: string) => boolean;
  find: (command: string, env: NodeJS.ProcessEnv) => string | undefined;
  report: (message: string) => void;
  run: (
    command: string,
    args: readonly string[],
    cwd: string,
    env: NodeJS.ProcessEnv
  ) => {status: number; stdout: string};
}
export const nativeDoctor = async (
  options: NativeDoctorOptions,
  callback?: (status: number) => void,
  dependencies: NativeDoctorDependencies = {
    env: process.env,
    exists: nativeDirectoryExists,
    find: findNativeExecutable,
    report: reportNative,
    run: runNativeCheck
  }
): Promise<number> => {
  const deps = dependencies;
  const env = {...deps.env};
  const standardDirectory = '/Applications/Xcode.app/Contents/Developer';
  if(options.developerDir) {
    env.DEVELOPER_DIR = options.developerDir;
  } else if(!env.DEVELOPER_DIR && deps.exists(standardDirectory)) {
    env.DEVELOPER_DIR = standardDirectory;
  }
  const cwd = options.cwd || process.cwd();
  const rbenv = deps.find('rbenv', env);
  let status = 0;
  const check = (label: string, command: string, args: readonly string[], missing: string, ruby = false) => {
    try {
      const result = deps.run(ruby && rbenv ? 'rbenv' : command, ruby && rbenv ? ['exec', command, ...args] : args, cwd, env);
      if(result.status === 0) {
        deps.report(`ok  ${label}: ${result.stdout.trim().replaceAll('\n', ' ')}`);
        return;
      }
    } catch{
      // Missing tools cannot suppress the remaining diagnostics.
    }
    status = 1;
    deps.report(missing);
  };
  check('Xcode', 'xcodebuild', ['-version'], 'missing  full Xcode with selected command-line tools');
  const watchman = deps.find('watchman', env);
  if(watchman) {
    deps.report(`ok  watchman: ${watchman}`);
  } else {
    status = 1;
    deps.report('missing  watchman (brew bundle)');
  }
  check('Ruby', 'ruby', ['--version'], 'missing  project Ruby (install the .ruby-version through rbenv)', true);
  if(options.requireBundler) {
    check('Bundler', 'bundle', ['--version'], 'missing  Bundler (run rbenv exec gem install bundler)', true);
  }
  check('CocoaPods', 'bundle', ['exec', 'pod', '--version'], 'missing  bundled CocoaPods (run bundle install)', true);
  callback?.(status);
  return status;
};
