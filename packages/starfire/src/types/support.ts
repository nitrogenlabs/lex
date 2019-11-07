export interface SFSupportType {
  readonly category?: string;
  readonly cliName?: string;
  readonly default?: boolean;
  readonly deprecated?: string;
  readonly description?: string;
  readonly redirect?: SFSupportRedirectType;
  readonly since?: string;
  readonly type?: boolean;
}

export interface SFSupportRedirectType {
  readonly option: string;
  readonly value: string;
}
