---
id: cli
title: Lex CLI Options
---

Lex is pre-configured for React but can use custom configuration files.

### `add`

Add helper files to get your app up and running quickly. Add settings, stores, and views to your workspace.

**Options:**

- `-l [path]`, `--lexConfig [path]` - Lex configuration file path (lex.config.js).
- `-q`, `--quiet` - No Lex notifications printed in the console.
- `-t`, `--typescript` - Add Typescript based files.

**Types:**

- `store <storeName>` - Add a directory with a new store and associated test file.

- `tsconfig` - Add a compatible tsconfig.json to your workspace. The build processes and Babel transpiler require Typescript for static type checking. This config gets automatically created if none exists but you can use the `add` command to specifically add it if necessary.

- `view <viewName>` - Add a directory with a new view, stylesheet and associated test file.

- `vscode` - Add [Visual Studio Code](https://code.visualstudio.com/) (VSCode) settings to your workspace.

**Examples:**

```shell
// Add a store
$ lex add store myStore
```

### `build`

Compiles all source code, pack into chunked files, and move all static files to output folder using Webpack.

**Options:**

- `-b <path>`, `--babel <path>` - Babel configuration file path.
- `-c <path>`, `--config <path>` - Custom webpack configuration file path (webpack.config.js).
- `-l <path>`, `--lexConfig <path>` - Custom Lex configuration file path. Default: `'./lex.config.js`.
- `-m <type>`, `--mode <type>` - Webpack mode ("production" or "development").
- `-q`, `--quiet` - No Lex notifications printed in the console.
- `-r`, `--remove` - Removes all files from the output directory before compiling.
- `-t`, `--typescript` - Transpile as Typescript.

**Examples:**

```shell
// Build
$ lex build

// Build using Typescript
$ lex build -t

// Custom lex config
$ lex build -l ./lex.config.js

// Custom Webpack config
$ lex build -c ./webpack.config.js
```

### `clean`

Clean lock files, node_modules, and log files. If specified, will even clear out `__snapshots__`.

**Options:**

- `-q`, `--quiet` - No Lex notifications printed in the console.
- `-s`, `--snapshots` - Remove all "__snapshots__" directories.

**Examples:**

```shell
// Clean app directory
$ lex clean

// Clean app directory including snapshots
$ lex clean -s
```

### `compile`

Checks all static types using either Flow or Typescript. Then compiles all source code to output folder.

**Options:**

- `-b <path>`, `--babel <path>` - Babel configuration file path.
- `-c <path>`, `--config <path>` - Transpiler configuration file path (.flowconfig or tsconfig.json).
- `-l <path>`, `--lexConfig <path>` - Custom Lex configuration file path. Default: `'./lex.config.js`.
- `-q`, `--quiet` - No Lex notifications printed in the console.
- `-r`, `--remove` - Removes all files from the output directory before compiling.
- `-t`, `--typescript` - Transpile as Typescript.
- `-w`, `--watch` - Watches for changes and compiles.

**Examples:**

```shell
// Compile from Javascript/Flow files
$ lex compile

// Compile from Typescript files
$ lex compile -t

// Custom lex config
$ lex compile -l ./lex.config.js
```

### `dev`

Spins up a development environment for the app. The development server is located at: [http://localhost:8080](http://localhost:8080) A new browser window will automatically open if using the `-o` flag.

The server loads the static files as well as dynamically loads all JavaScript. Taking things one step further -- with the use of Hot Module Replacement (HMR) -- the browser automatically refreshes as changes are made. In the case of React, it allows the application to maintain its state without forcing a refresh. While this does not sound all that special, it can make a big difference in practice.

**Options:**

- `-b <path>`, `--babel <path>` - Babel configuration file path.
- `-c <path>`, `--config <path>` - Custom Webpack configuration file path (ie. webpack.config.js).
- `-l <path>`, `--lexConfig <path>` - Custom Lex configuration file path. Default: `'./lex.config.js`.
- `-o`, `--open` - Automatically open dev server in a new browser window.
- `-q`, `--quiet` - No Lex notifications printed in the console.
- `-r`, `--remove` - Removes all files from the output directory before compiling.
- `-t`, `--typescript` - Transpile as Typescript.

**Examples:**

```shell
// Run dev server
$ lex dev

// Run dev server using Typescript
$ lex dev -t

// Run dev server and open in new window
$ lex dev -o

// Custom lex config
$ lex dev -l ./lex.config.js

// Run dev server with custom Webpack config
$ lex dev -c ./webpack.config.js
```

### `init`

Creates a new app shell. An initial directory structure with files is created based off a node module. By default [@nlabs/arkhamjs-example-flow-react](https://github.com/nitrogenlabs/arkhamjs-example-flow-react) is used and [@nlabs/arkhamjs-example-ts-react](https://github.com/nitrogenlabs/arkhamjs-example-ts-react) for Typescript. If an existing node module is preferred, it may be used instead.

**Options**

- `-i`, `--install` - Install dependencies.
- `-q`, `--quiet` - No Lex notifications printed in the console.
- `-t`, `--typescript` - Use a Typescript based app.

**Examples:**

```shell
// Create a new base app
$ lex init myApp

// Create a new Typescript base app
$ lex init myApp -t

// Custom base app
$ lex init myApp custom-base-module
```

### `test`

Runs all unit tests with Jest.

**Options:**

- `-c <path>`, `--config <path>` - Custom Jest configuration file path (ie. jest.config.js).
- `-l <path>`, `--lexConfig <path>` - Custom Lex configuration file path (ie. lex.config.js). Default: `'./lex.config.js`.
- `-q`, `--quiet` - No Lex notifications printed in the console.
- `-s <path>`, `--setup <path>` - Jest setup file path.
- `-t`, `--typescript` - Transpile as Typescript.
- `-u`, `--update` - Update snapshots. Runs `jest --updateSnapshots`
- `-w`, `--watch` - Watches for changes and tests. Runs `jest --watch`
- `-v [showDetails]`, `--verbose [showDetails]` - Print the version and exit. `showDetails` is either `true` or `false`. Default: `true`.

**Examples:**

```shell
// Run unit tests
$ lex test

// Run unit tests with Typescript
$ lex test -t

// Custom lex config
$ lex test -l ./lex.config.js

// Custom Jest config
$ lex test -c ./jest.config.js

// Initial Jest setup
$ lex test -s ./jest.setup.js

// Update snapshots
$ lex test -u
```

### `update`

Update all dependencies in app to the latest versions. Use the interactive mode to pick and choose what apps should update.

**Options:**

- `-i`, `--interactive` - Choose which packages to update.
- `-q`, `--quiet` - No Lex notifications printed in the console.

**Examples:**

```shell
// Update dependencies
$ lex update
```

### `upgrade`

Update Lex to the latest version globally.

**Options:**

- `-q`, `--quiet` - No Lex notifications printed in the console.

**Examples:**

```shell
// Update Lex
$ lex upgrade
```

### `versions`

List versions of Lex as well as the versions being used for Jest, Typescript and Webpack.

**Options:**

- `-j`, `--json` - Print the versions as a JSON object.

**Examples:**

```shell
// Get versions
$ lex versions
```
