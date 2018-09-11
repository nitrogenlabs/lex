# Configuration

## Configuration

```js
{
  entryHTML: 'index.html',
  entryJS: 'index.js',
  env: {'NODE_ENV': process.env.NODE_ENV},
  outputPath: './dist',
  sourcePath: './src',
  useTypescript: false
}
```

- **entryHTML** - *(string)* Root HTML entry point. This should be the initial HTML filename within the `./src` directory. Default: `'index.html'`
- **entryJS** - *(string)* Root javascript code entry point. This should be the initial Typescript filename within the `./src` directory. Default: `'index.js'`
- **env** - *(object)*  Key/value sets for environment variables. These environment variables will be available to your app. Default: `{'NODE_ENV': process.env.NODE_ENV}`
- **libraryName** - *(string)* Name for compiled library.
- **libraryTarget** - *(string)* File path for compiled library.
- **outputFile** - *(string)* Filename of transpiled entry file in output path. Default: `'[name].js'`
- **outputHash** - *(boolean)* Add a hash after output js files to prevent caching of updated files. Default: `false`
- **outputPath** - *(string)* File path where all transpiled code and static files are exported to. Default: `'./dist'`
- **packageManager** - *(string)* Package manager to use for installing. Default `'yarn'`
- **sourcePath** - *(string)* File path that includes all source files. Default: `'./src'`
- **targetEnvironment** - *('node'|'web')* Webpack environment to use when compiling. Default: `'node'`
- **useTypescript** - *(boolean)* Use Typescript to transpile. Otherwise use Flow. Default: `false`
