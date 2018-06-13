---
id: configuration
title: Configuration
---

## Configuration

```js
{
  entryHTML: 'index.html',
  entryJS: 'app.tsx',
  env: {'NODE_ENV': process.env.NODE_ENV},
  outputPath: './dist',
  sourcePath: './src',
  useTypescript: false
}
```

- **entryHTML** - *(string)* Root HTML entry point. This should be the initial HTML filename within the `./src` directory. Default: `'index.html'`
- **entryJS** - *(string)* Root javascript code entry point. This should be the initial Typescript filename within the `./src` directory. Default: `'app.tsx'`
- **env** - *(object)*  Key/value sets for environment variables. These environment variables will be available to your app. Default: `{'NODE_ENV': process.env.NODE_ENV}`
- **outputPath** - *(string)* Directory where all transpiled code and static files are exported to. Default: `'./dist'`
- **sourcePath** - *(string)* Directory that includes all source files. Default: `'./src'`
- **useTypescript** - *(boolean)* Use Typescript to transpile. Otherwise use Flow. Default: `false`
