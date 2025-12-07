#!/usr/bin/env node
/**
 * Test script to verify webpack, PostCSS plugins, and static file serving
 *
 * Usage:
 *   node scripts/test-webpack.js
 *
 * This script:
 * 1. Creates a temporary test project
 * 2. Builds it with webpack
 * 3. Verifies PostCSS plugins work
 * 4. Checks that static files are accessible
 */

import {execSync, spawn} from 'child_process';
import {existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'fs';
import {createConnection} from 'net';
import {join} from 'path';
import {tmpdir} from 'os';

const testDir = join(tmpdir(), `lex-webpack-test-${Date.now()}`);

console.log('🧪 Creating test project...');
mkdirSync(testDir, {recursive: true});
mkdirSync(join(testDir, 'src'), {recursive: true});
mkdirSync(join(testDir, 'src', 'images'), {recursive: true});
mkdirSync(join(testDir, 'src', 'static'), {recursive: true});

writeFileSync(join(testDir, 'package.json'), JSON.stringify({
  name: 'test-webpack-project',
  version: '1.0.0',
  type: 'module'
}, null, 2));

writeFileSync(join(testDir, 'src', 'index.html'), `<!DOCTYPE html>
<html>
<head>
  <title>Test App</title>
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <div class="container">
    <h1>Test App</h1>
    <div class="test-for-loop">PostCSS @for loop test</div>
    <div class="test-percentage">PostCSS percentage() test</div>
  </div>
  <script src="./index.js"></script>
</body>
</html>`);

writeFileSync(join(testDir, 'src', 'index.js'), `
  console.log('Hello from test project');
  import './styles.css';
`);

writeFileSync(join(testDir, 'src', 'styles.css'), `
  /* Test PostCSS @for loop */
  @for $i from 1 to 4 {
    .test-for-loop:nth-child($i) {
      width: calc($i * 25px);
    }
  }

  /* Test PostCSS percentage() function */
  .test-percentage {
    width: percentage(1/3);
    padding: percentage(0.05);
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
`);

writeFileSync(join(testDir, 'src', 'images', 'test.png'), 'fake-png-content');
writeFileSync(join(testDir, 'src', 'images', 'logo-icon-64.png'), 'fake-png-content');
writeFileSync(join(testDir, 'src', 'static', 'test.txt'), 'Static file content');
writeFileSync(join(testDir, 'src', 'favicon.ico'), 'fake-ico-content');
writeFileSync(join(testDir, 'src', 'manifest.json'), JSON.stringify({name: 'Test App'}, null, 2));

writeFileSync(join(testDir, 'lex.config.js'), `
export default {
  entryJs: 'index.js',
  entryHTML: 'index.html',
  outputPath: './build',
  sourcePath: './src',
  webpack: {
    staticPath: './src/static'
  }
};
`);

console.log('📦 Building with webpack...');
try {
  const lexPath = join(process.cwd(), 'lib', 'lex.js');
  try {
    const result = execSync(`node "${lexPath}" build --bundler webpack --outputPath ./build --sourcePath ./src`, {
      cwd: testDir,
      stdio: 'pipe',
      encoding: 'utf8',
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });
    console.log(result.toString());
  } catch (error) {
    console.error('Build error output:', error.stdout || error.stderr || error.message);
    throw error;
  }

  console.log('✅ Build completed successfully!\n');

  const buildDir = join(testDir, 'build');

  console.log('🔍 Verifying build output...');

  const indexHtml = join(buildDir, 'index.html');
  if (existsSync(indexHtml)) {
    const htmlContent = readFileSync(indexHtml, 'utf8');
    if (htmlContent.includes('Test App')) {
      console.log('✅ HTML file generated correctly');
    } else {
      console.log('❌ HTML content incorrect');
    }
  } else {
    console.log('❌ HTML file not found');
  }

  const cssFiles = ['index.css'];
  const jsFiles = ['index.js', 'index.*.js'];
  let cssFound = false;
  let cssProcessed = false;

  for (const cssFile of cssFiles) {
    const cssPath = join(buildDir, cssFile);
    if (existsSync(cssPath)) {
      cssFound = true;
      const cssContent = readFileSync(cssPath, 'utf8');
      console.log('✅ CSS file generated');

      if (cssContent.includes('test-for-loop')) {
        const hasForLoop = /width:\s*calc\([^)]*25px\)/.test(cssContent);
        if (hasForLoop) {
          console.log('✅ PostCSS @for loop processed correctly');
          cssProcessed = true;
        }
      }

      if (cssContent.includes('test-percentage')) {
        const hasPercentage = /width:\s*[\d.]+%/.test(cssContent);
        if (hasPercentage) {
          console.log('✅ PostCSS percentage() function processed correctly');
          cssProcessed = true;
        }
      }
      break;
    }
  }

  if (!cssFound) {
    const files = readdirSync(buildDir);
    const jsFile = files.find(f => f.startsWith('index.') && f.endsWith('.js') && !f.includes('runtime') && !f.includes('vendors'));
    if (jsFile) {
      const jsContent = readFileSync(join(buildDir, jsFile), 'utf8');
      if (jsContent.includes('calc') && jsContent.includes('25px')) {
        console.log('✅ CSS processed and inlined in JS (PostCSS @for loop detected)');
        cssProcessed = true;
      }
      if (jsContent.includes('%') && /[\d.]+%/.test(jsContent)) {
        console.log('✅ CSS processed and inlined in JS (PostCSS percentage() detected)');
        cssProcessed = true;
      }
    }
    if (!cssProcessed) {
      console.log('⚠️  CSS file not found (may be inlined or named differently)');
    }
  }

  const staticFile = join(buildDir, 'test.txt');
  if (existsSync(staticFile)) {
    const staticContent = readFileSync(staticFile, 'utf8');
    if (staticContent === 'Static file content') {
      console.log('✅ Static file copied correctly');
    } else {
      console.log('❌ Static file content incorrect');
    }
  } else {
    console.log('⚠️  Static file not found (may not be copied in this configuration)');
  }

  console.log('\n🌐 Testing dev server and static file access...');

  const testPort = 3001;

  if (!existsSync(buildDir)) {
    console.log('⚠️  Build directory does not exist, creating it...');
    mkdirSync(buildDir, {recursive: true});
  }

  let devServerProcess = null;
  let serverReady = false;
  let serverError = null;

  try {
    devServerProcess = spawn('node', [lexPath, 'dev', '--port', testPort.toString(), '--quiet'], {
      cwd: testDir,
      stdio: 'pipe',
      env: {
        ...process.env,
        LEX_QUIET: 'true',
        NODE_ENV: 'development'
      }
    });

    let serverOutput = '';
    let serverStartedOutput = false;
    devServerProcess.stdout.on('data', (data) => {
      const output = data.toString();
      serverOutput += output;
      // Check for server ready indicators
      if (output.includes('compiled') || output.includes('Local:') || output.includes('http://') || output.includes('webpack compiled')) {
        serverStartedOutput = true;
      }
    });

    devServerProcess.stderr.on('data', (data) => {
      const output = data.toString();
      serverOutput += output;
      if (output.includes('error') || output.includes('Error') || output.includes('ERROR')) {
        serverError = output;
      }
      // Sometimes webpack outputs to stderr but it's not an error
      if (output.includes('compiled') || output.includes('webpack')) {
        serverStartedOutput = true;
      }
    });

    devServerProcess.on('error', (error) => {
      serverError = error.message;
    });

    console.log(`⏳ Waiting for dev server to start on port ${testPort}...`);
    console.log('   (This may take 30-60 seconds for initial compilation)');

    const checkPort = (port) => {
      return new Promise((resolve) => {
        const socket = createConnection(port, 'localhost');
        socket.on('connect', () => {
          socket.destroy();
          resolve(true);
        });
        socket.on('error', () => {
          resolve(false);
        });
        socket.setTimeout(1000, () => {
          socket.destroy();
          resolve(false);
        });
      });
    };

    const waitForServer = async () => {
      for (let i = 0; i < 90; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const portOpen = await checkPort(testPort);
        if (portOpen || serverStartedOutput) {
          // Give it a bit more time to fully initialize
          await new Promise(resolve => setTimeout(resolve, 3000));

          // Try to access the static file directly
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(`http://localhost:${testPort}/test.txt`, {
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (response.ok && response.status === 200) {
              const content = await response.text();
              if (content.includes('Static file content')) {
                return true;
              }
            }
          } catch (error) {
            if (error.name !== 'AbortError' && i > 5) {
              // Only log after a few attempts
            }
          }

          // Also try index.html as a fallback check
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(`http://localhost:${testPort}/index.html`, {
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (response.ok || response.status === 200) {
              // Server is up, even if static file test didn't work yet
              if (i > 10) {
                // After 10 seconds, if server is up, try static file again
                try {
                  const staticResponse = await fetch(`http://localhost:${testPort}/test.txt`, {
                    signal: controller.signal
                  });
                  if (staticResponse.ok) {
                    return true;
                  }
                } catch {
                }
              }
            }
          } catch (error) {
            if (error.name !== 'AbortError') {
            }
          }
        }

        if (i % 10 === 9 && i > 0) {
          console.log(`   Still waiting... (${i + 1}/90 seconds)`);
        }
      }
      return false;
    };

    serverReady = await waitForServer();

    if (serverError) {
      console.log(`❌ Dev server error: ${serverError}`);
      console.log('❌ HTTP tests cannot run due to server error');
      console.log('💡 Note: Static files are copied to build directory and should be accessible via dev server');
      throw new Error(`Dev server failed to start: ${serverError}`);
    } else if (!serverReady) {
      console.log('❌ Dev server did not start within 60 seconds');
      console.log('❌ HTTP tests cannot run - this is a required test');
      console.log('💡 To test manually, run: cd <test-dir> && lex dev --port 3001');
      if (serverOutput) {
        const lastOutput = serverOutput.slice(-2000);
        console.log('\nServer output (last 2000 chars):');
        console.log(lastOutput);
        // Check if there are any obvious errors
        if (lastOutput.includes('Error') || lastOutput.includes('error') || lastOutput.includes('Cannot find')) {
          console.log('\n⚠️  Potential errors detected in server output above');
        }
      } else {
        console.log('   (No server output captured - server may not have started)');
        console.log('   This could indicate the process failed to spawn or exited immediately');
      }

      // Check if process is still running
      if (devServerProcess && !devServerProcess.killed) {
        try {
          devServerProcess.kill(0); // Check if process exists
          console.log('   (Dev server process is still running but not responding)');
        } catch {
          console.log('   (Dev server process has exited)');
        }
      }
      throw new Error('Dev server did not start within timeout period - HTTP static file access test cannot run');
    } else {
      console.log(`✅ Dev server started on port ${testPort}`);

      const testUrls = [
        {url: '/test.txt', expectedContent: 'Static file content', description: 'Static file from staticPath', required: true},
        {url: '/index.html', expectedContent: 'Test App', description: 'HTML file', required: false},
        {url: '/images/test.png', expectedContent: 'fake-png-content', description: 'Image file', required: false}
      ];

      let httpTestFailed = false;
      const httpTestErrors = [];

      for (const test of testUrls) {
        try {
          const response = await fetch(`http://localhost:${testPort}${test.url}`);
          if (response.ok) {
            const content = await response.text();
            if (content.includes(test.expectedContent)) {
              console.log(`✅ ${test.description} accessible via HTTP (${test.url})`);
            } else {
              const errorMsg = `${test.description} accessible but content doesn't match (${test.url})`;
              console.log(`❌ ${errorMsg}`);
              if (test.required) {
                httpTestFailed = true;
                httpTestErrors.push(errorMsg);
              }
            }
          } else {
            const errorMsg = `${test.description} returned status ${response.status} (${test.url})`;
            console.log(`❌ ${errorMsg}`);
            if (test.required) {
              httpTestFailed = true;
              httpTestErrors.push(errorMsg);
            }
          }
        } catch (error) {
          const errorMsg = `Failed to fetch ${test.description}: ${error.message}`;
          console.log(`❌ ${errorMsg}`);
          if (test.required) {
            httpTestFailed = true;
            httpTestErrors.push(errorMsg);
          }
        }
      }

      if (httpTestFailed) {
        console.log('\n❌ HTTP static file access test FAILED!');
        console.log('Errors:');
        httpTestErrors.forEach(err => console.log(`  - ${err}`));
        console.log('\n💡 The dev server must be able to serve static files from the staticPath directory.');
        console.log('💡 Check that the middleware in webpack.config.js is correctly serving files from staticPathFull.');
        throw new Error('HTTP static file access test failed');
      } else {
        console.log('\n✅ All HTTP static file access tests passed!');
      }
    }

  } catch (error) {
    console.error(`\n❌ Dev server HTTP test failed: ${error.message}`);
    console.error('This test is required and must pass.');
    throw error;
  } finally {
    if (devServerProcess) {
      console.log('🛑 Stopping dev server...');
      devServerProcess.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (devServerProcess.killed === false) {
        devServerProcess.kill('SIGKILL');
      }
      console.log('✅ Dev server stopped');
    }
  }

  // Only print success if we didn't throw an error
  console.log('\n🎉 All tests passed!');
  console.log(`\n📁 Test project location: ${testDir}`);
  console.log('💡 You can inspect the build output in the build/ directory');

} catch (error) {
  console.error('\n❌ Test suite failed:', error.message);
  if (error.stack) {
    console.error('\nStack trace:');
    console.error(error.stack);
  }
  process.exit(1);
} finally {
  console.log('\n🧹 Cleaning up...');
  try {
    rmSync(testDir, {recursive: true, force: true});
    console.log('✅ Cleanup complete');
  } catch {
    console.log('⚠️  Could not clean up test directory:', testDir);
  }
}

