import glob from 'glob';
import fs from 'fs';
import path from 'path';

const readFile = (path: string) => {
  try {
    return fs.readFileSync(path, 'utf8');
  } catch(error) {
    console.error(error.message);
    return null;
  }
};

export const directoryContains = (referenceDir: string, targetDir: string, done) => {
  const compareFile = (file: string) => {
    const referenceFile = readFile(path.join(referenceDir, file));
    const targetFile = readFile(path.join(targetDir, file));

    if(referenceFile !== targetFile) {
      console.log('referenceFile', referenceFile);
      console.log('targetFile', targetFile);
    }

    return referenceFile === targetFile;
  };

  glob('**/*', {cwd: referenceDir, nodir: true}, (err, files) => {
    if(err) {
      return done(err);
    }

    return done(null, files.every((filename: string) => compareFile(filename)));
  });
};
