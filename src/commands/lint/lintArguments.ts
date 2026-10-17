export interface EslintRunOptions {
  readonly configPath?: string;
  readonly fixDryRun?: boolean;
  readonly fixType?: string;
  readonly maxWarnings?: string;
  readonly readOnlyCacheLocation?: string;
  readonly rule?: string;
}

export const eslintArguments = (
  fix: boolean,
  debug: boolean,
  {configPath, fixDryRun, fixType, maxWarnings, readOnlyCacheLocation, rule}: EslintRunOptions = {}
): string[] => {
  const fixArgs = fix ? ['--fix'] : [];

  return [
    ...(configPath ? ['--config', configPath] : []),
    ...(fixDryRun ? ['--fix-dry-run'] : fixArgs),
    ...(fixType === undefined ? [] : ['--fix-type', fixType]),
    ...(rule === undefined ? [] : ['--rule', rule]),
    ...(debug ? ['--debug'] : []),
    ...(maxWarnings === undefined ? [] : ['--max-warnings', maxWarnings]),
    ...(readOnlyCacheLocation ? ['--cache-location', readOnlyCacheLocation] : []),
    '--no-error-on-unmatched-pattern',
    '--no-warn-ignored'
  ];
};

export const assertFixTypeOptions = (check: boolean, fix: boolean, fixType?: string): void => {
  if(fixType !== undefined && (check || fix)) {
    throw new Error('--fixType cannot be combined with --check or --fix');
  }
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
