import findFileUp from 'find-file-up';
import fs from 'fs';
import ora from 'ora';
import path from 'path';

export const createSpinner = (quiet = false): any => {
  if(quiet) {
    return {
      fail: () => {},
      start: () => {},
      succeed: () => {}
    };
  }

  return ora({color: 'yellow'});
};

export const relativeFilePath = (filename, nodePath = './', backUp = 0) => {
  const nestDepth = 10;

  if(backUp) {
    const filePath = findFileUp.sync(filename, nodePath, nestDepth);
    const previousPath = Array(backUp).fill(null).map(() => '../').join('');
    return path.resolve(filePath, previousPath);
  }

  return findFileUp.sync(filename, nodePath, nestDepth);
};

export const getScript = (script): string => {
  const appPath: string = path.resolve(process.cwd(), script);

  if(fs.existsSync(appPath)) {
    return appPath;
  }

  const libPath: string = relativeFilePath(path.resolve(__dirname, '../', script));

  if(fs.existsSync(libPath)) {
    return libPath;
  }

  return null;
};

export const resolveModule = (moduleName): string => {
  const libModulePath: string = path.resolve(__dirname, '../../node_modules/', moduleName);
  const appModulePath: string = path.resolve(process.cwd(), './node_modules', moduleName);
  return fs.existsSync(appModulePath) ? appModulePath : libModulePath;
};
