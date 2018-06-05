import * as fs from 'fs';

export const log = (message: string, cmd = {quiet: false}) => {
  if(!cmd.quiet) {
    console.log(message);
  }
};

export const getPackageJson = (packagePath?: string) => {
  const path: string = packagePath || `${process.cwd()}/package.json`;

  // Configure package.json
  const packageData: string = fs.readFileSync(path).toString();
  return JSON.parse(packageData);
};

export const setPackageJson = (json, packagePath?: string) => {
  if(!json) {
    return;
  }

  const path: string = packagePath || `${process.cwd()}/package.json`;

  // Update package.json
  fs.writeFileSync(path, JSON.stringify(json, null, 2));
};
