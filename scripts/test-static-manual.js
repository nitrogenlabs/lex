#!/usr/bin/env node
/**
 * Manual test script to verify static file serving
 * This script starts the dev server and tests static file access
 */

import {spawn} from 'child_process';
import {createConnection} from 'net';
import {join,dirname} from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const testPort = 3002;
const lexPath = join(projectRoot, 'lib', 'lex.js');

console.log('🧪 Starting dev server to test static file serving...');
console.log(`   Port: ${testPort}`);
console.log(`   Static path: ${join(projectRoot, 'src', 'static')}`);
console.log(`   Test file: ${join(projectRoot, 'src', 'static', 'test.txt')}\n`);

const devServerProcess = spawn('node', [lexPath, 'dev', '--port', testPort.toString()], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

const checkPort = (port) => new Promise((resolve) => {
  const socket = createConnection(port, 'localhost');
  socket.on('connect', () => {
    socket.destroy();
    resolve(true);
  });
  socket.on('error', () => {
    resolve(false);
  });
  socket.setTimeout(2000, () => {
    socket.destroy();
    resolve(false);
  });
});

const waitForServer = async () => {
  console.log('⏳ Waiting for server to start...');
  for(let i = 0; i < 60; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const portOpen = await checkPort(testPort);
    if(portOpen) {
      console.log(`✅ Server is running on port ${testPort}\n`);
      return true;
    }
    if(i % 5 === 4) {
      process.stdout.write('.');
    }
  }
  return false;
};

const testStaticFile = async () => {
  try {
    console.log('🌐 Testing static file access...');
    const response = await fetch(`http://localhost:${testPort}/test.txt`);
    console.log(`   Status: ${response.status}`);
    console.log('   Headers:', Object.fromEntries(response.headers.entries()));

    if(response.ok) {
      const content = await response.text();
      console.log(`   Content: "${content}"`);
      console.log('\n✅ Static file is accessible!');
      return true;
    }
    console.log(`\n❌ Static file returned status ${response.status}`);
    const text = await response.text();
    console.log(`   Response: ${text.substring(0, 200)}`);
    return false;
  } catch(error) {
    console.log(`\n❌ Error accessing static file: ${error.message}`);
    return false;
  }
};

waitForServer().then(async (serverReady) => {
  if(!serverReady) {
    console.log('\n❌ Server did not start within 60 seconds');
    devServerProcess.kill('SIGTERM');
    process.exit(1);
  }

  // Give it a moment to fully initialize
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const success = await testStaticFile();

  console.log('\n🛑 Stopping dev server...');
  devServerProcess.kill('SIGTERM');
  setTimeout(() => {
    if(!devServerProcess.killed) {
      devServerProcess.kill('SIGKILL');
    }
    process.exit(success ? 0 : 1);
  }, 1000);
});

devServerProcess.on('error', (error) => {
  console.error('❌ Failed to start dev server:', error.message);
  process.exit(1);
});

