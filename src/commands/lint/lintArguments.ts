interface EslintRunOptions {
  readonly configPath?: string;
  readonly fixDryRun?: boolean;
  readonly maxWarnings?: string;
  readonly readOnlyCacheLocation?: string;
}

export const eslintArguments = (
  fix: boolean, debug: boolean, {configPath, fixDryRun, maxWarnings, readOnlyCacheLocation}: EslintRunOptions = {}
): string[] => {
  const fixArgs = fix ? ['--fix'] : [];

  return [
    ...(configPath ? ['--config', configPath] : []),
    ...(fixDryRun ? ['--fix-dry-run'] : fixArgs),
    ...(debug ? ['--debug'] : []),
    ...(maxWarnings === undefined ? [] : ['--max-warnings', maxWarnings]),
    ...(readOnlyCacheLocation ? ['--cache-location', readOnlyCacheLocation] : []),
    '--no-error-on-unmatched-pattern',
    '--no-warn-ignored'
  ];
};

export const assertDryRunOptions = (fixDryRun: boolean, fix: boolean, removeComments: boolean): void => {
  if(fixDryRun && (fix || removeComments)) {
    throw new Error('--fixDryRun cannot be combined with --fix or --remove-comments');
  }
};

export const assertCheckOptions = (check: boolean, dryRun: boolean, fix: boolean, comments: boolean): void => {
  if(check && (dryRun || fix || comments)) {
    throw new Error('--check cannot be combined with --fixDryRun, --fix or --remove-comments');
  }
};
