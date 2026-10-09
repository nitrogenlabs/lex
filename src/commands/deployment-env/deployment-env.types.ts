export type DeploymentEnvMode = 'setup' | 'validate';
export type DeploymentEnvValues = Readonly<Record<string, string | undefined>>;
export interface DeploymentEnvRequirement {
  readonly optionalVariableNames: readonly string[];
  readonly requiredSecretNames: readonly string[];
  readonly requiredVariableNames: readonly string[];
}
export interface DeploymentEnvStage {
  readonly defaults: Readonly<Record<string, string>>;
  readonly environment: string;
  readonly validationRules?: readonly {readonly expected: string; readonly name: string; readonly normalization: 'none' | 'trailing-slashes'}[];
}
export interface DeploymentEnvDescriptor {
  readonly repository?: string;
  readonly schemaVersion: 1;
  readonly setup: DeploymentEnvRequirement;
  readonly stages: Readonly<Record<string, DeploymentEnvStage>>;
  readonly validation: DeploymentEnvRequirement;
}
export interface DeploymentEnvOptions {
  readonly descriptorPath: string;
  readonly dryRun?: boolean;
  readonly envFile?: string;
  readonly mode: DeploymentEnvMode;
  readonly quiet?: boolean;
  readonly repo?: string;
  readonly stage?: string;
}
export interface DeploymentEnvTarget {
  readonly environment: string;
  readonly kind: 'environment' | 'secret' | 'variable';
  readonly name?: string;
  readonly stage: string;
}
export interface DeploymentEnvPlan {
  readonly mode: DeploymentEnvMode;
  readonly repository?: string;
  readonly targets: readonly DeploymentEnvTarget[];
}
export interface DeploymentEnvResult {
  readonly completed: readonly DeploymentEnvTarget[];
  readonly pending: readonly DeploymentEnvTarget[];
  readonly plan?: DeploymentEnvPlan;
  readonly status: 0 | 1;
}
export type DeploymentEnvRunner = (request: {readonly args: readonly string[]; readonly input?: string}) => Promise<{readonly signal?: string; readonly status: number | null; readonly stdout: string}>;
export interface DeploymentEnvDependencies {
  readonly readText: (path: string) => Promise<string>;
  readonly report: (message: string) => void;
  readonly run: DeploymentEnvRunner;
  readonly values: DeploymentEnvValues;
}
