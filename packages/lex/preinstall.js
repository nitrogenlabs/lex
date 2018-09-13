#!/usr/bin/env node
const {spawnSync} = require('child_process');

// Make sure we set
if(process.env.npm_execpath.indexOf('yarn') > -1) {
  const yarnOptions = [
    'config',
    'set',
    'prefix',
    process.env.npm_node_execpath
  ];
  const yarn = spawnSync('yarn', yarnOptions);
  process.exit(yarn.status);
}

process.exit(0);
