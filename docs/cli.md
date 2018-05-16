---
id: cli
title: Lex CLI Options
---

Lex is pre-configured for React but can use custom configuration files.

### `add`

**Options:**

- `-t` - Add Typescript based files.

Will add helper files to get you up and running quickly. Add settings, stores, and views to your workspace.

**Types:**

- `vscode` - Add [Visual Studio Code](https://code.visualstudio.com/) (VSCode) settings to your workspace.

- `store <storeName>` - Add a directory with a new store and associated test file.

- `view <viewName>` - Add a directory with a new view, stylesheet and associated test file.

**Examples:**

```shell
// Add a store
$ lex add store myStore
```

### `build`

Compiles all source code, pack into chunked files, and move all static files to output folder using Webpack.

**Options:**

- `-c <webpackConfig>` - Custom Webpack configuration file path.
- `-l <lexConfigPath>` - Custom Lex configuration file path. Default: `'./lex.config.js`.
- `-t` - Use Typescript as a transpiler.

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

### `compile`

Checks all static types using either Flow or Typescript. Then compiles all source code to output folder.

**Options:**

- `-l <lexConfigPath>` - Custom Lex configuration file path. Default: `'./lex.config.js`.
- `-t` - Use Typescript as a transpiler.

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

- `-c <webpackConfigPath>` - Custom Webpack configuration file path.
- `-l <lexConfigPath>` - Custom Lex configuration file path. Default: `'./lex.config.js`.
- `-o` - Open dev server in default browser after building.
- `-t` - Use Typescript as a transpiler.

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

- `-c <jestConfigPath>` - Custom Jest configuration file path.
- `-l <lexConfigPath>` - Custom Lex configuration file path. Default: `'./lex.config.js`.
- `-s` - Path to setup file.
- `-t` - Use Typescript as a transpiler.
- `-u` - Update snapshots. Runs `jest --updateSnapshots`.

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

### `versions`

List versions of Lex as well as the versions being used for Jest, Typescript and Webpack.

**Examples:**

```shell
// Get versions
$ lex versions
```
