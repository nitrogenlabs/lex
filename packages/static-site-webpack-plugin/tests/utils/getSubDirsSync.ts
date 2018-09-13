import glob from 'glob';

export const getSubDirsSync = (cwd) => glob.sync('*/', {cwd}).map((subDir) => subDir.replace(/\/$/, ''));
