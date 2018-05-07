# lex

Lex is a console line execution module. Works out of the box for any React project, taking care of all your development needs. No need to install unit testing, transpilers, compilers, or even development servers. Install Lex globally and let go of all the grunt work, allowing you focus on coding your app.

## About

--------

When starting a new app, a lot of time is taken adding development essentials. Each website, app, or component needs to be tested and compiled. Setting up Babel, Jest, Typescript, and Webpack configurations each time a new project is created takes up time. And as the modules are updated, each project needs to be updated and maintained.

Lex eliminates this hassle. With the most common enterprise configurations used, developers can simply run and go. Lex uses the following libraries to assist in development.

- [Babel](https://babeljs.io/)
- [Flow](https://flow.org/)
- [Jest](https://facebook.github.io/jest/)
- [Typescript](http://www.typescriptlang.org/)
- [Webpack](https://webpack.js.org/)

### Transpiling

All source code is transpiled using Babel. Be able to use all the ES-next features of tomorrow, today. Promises, async/await, and arrow functions to name a few. Giving the codebase the potential to expand along with the project and team.

Lex uses Babel with the following presets and plugins:

- [@babel/plugin-proposal-pipeline-operator](https://www.npmjs.com/package/@babel/plugin-proposal-pipeline-operator)
- [@babel/preset-env](https://www.npmjs.com/package/@babel/preset-env)
- [@babel/preset-flow](https://www.npmjs.com/package/@babel/preset-flow)
- [@babel/preset-react](https://www.npmjs.com/package/@babel/preset-react)
- [@babel/preset-stage-0](https://www.npmjs.com/package/@babel/preset-stage-0)
- [@babel/preset-typescript](https://www.npmjs.com/package/@babel/preset-typescript)

### Static types

Code is type checking at compile time. While the use of static types is not required, it could help your programming immensely. Using static types within your codebase, will help reduce the amount of minor errors and bugs (typos, standard APIs, etc).

By default, all `.js` files will be checked by Flow. Typescript can be used instead if using the `-t` flag or `useTypescript` in a `lex.config.js` file.

### Webpack

Bundling your app has never been easier with Webpack 4. With the capability to code split dynamically, segments of code can even be lazy loaded. Lex uses Webpack with a few plugins to take care of the most common app requirements:

- [clean-webpack-plugin](https://www.npmjs.com/package/clean-webpack-plugin) - Removes all files from the output directory.
- [copy-webpack-plugin](https://www.npmjs.com/package/copy-webpack-plugin) - Copies all static files to output directory. This includes images (*./img*) and fonts (*./fonts*) files.
- [define-plugin](https://webpack.js.org/plugins/define-plugin) - Defines the environment variables.
- [html-webpack-plugin](https://www.npmjs.com/package/html-webpack-plugin) - Embed all scripts in *index.html*.
- [svg-spritemap-webpack-plugin](https://www.npmjs.com/package/svg-spritemap-webpack-plugin) - Include all SVG files in the source to be available via the SVG tag.

### Unit Testing

Unit tests are run using Jest. Jest was made to work particularly well with React and comes with some exciting features including snapshots.

## Installation

--------

Lex is installed globally using either npm or yarn.

```bash
// Using npm
$ npm install -g @nlabs/lex

// Using Yarn
$ yarn global add @nlabs/lex
```

## Quick Start

--------

```bash
// Install a skeleton app with the ArkhamJS framework
$ npm install -g yarn @nlabs/lex
$ lex init myApp
$ cd myApp
$ yarn

// Run the dev server
$ lex dev
```

## Usage

--------

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

```bash
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

```bash
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

```bash
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

```bash
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

```bash
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

```bash
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

```bash
// Get versions
$ lex versions
```

## Configuration

--------

```javascript
{
  entryHTML: 'index.html',
  entryJS: 'app.tsx',
  env: {'NODE_ENV': process.env.NODE_ENV},
  outputDir: './dist',
  sourceDir: './src',
  useTypescript: false
}
```

- **entryHTML** - *(string)* Root HTML entry point. This should be the initial HTML filename within the `./src` directory. Default: `'index.html'`
- **entryJS** - *(string)* Root javacsript code entry point. This should be the initial Typescript filename within the `./src` directory. Default: `'app.tsx'`
- **env** - *(object)*  Key/value sets for environment variables. These environment variables will be available to your app. Default: `{'NODE_ENV': process.env.NODE_ENV}`
- **outputDir** - *(string)* Directory where all transpiled code and static files are exported to. Default: `'./dist'`
- **sourceDir** - *(string)* Directory that includes all source files. Default: `'./src'`
- **useTypescript** - *(boolean)* Use Typescript to transpile. Otherwise use Flow. Default: `false`

## Setup

--------

### Environment Variables

Environment variables can be a very important part of your app. They can dynamically set configuration values your JS app can use later during runtime. Custom variables can be set in the lex configuration.

The environment variable, `process.env.NODE_ENV` is usually used to determine what environment the app is running in. When running `lex dev`, `NODE_ENV` will be set to *development*, and `lex build` will set `NODE_ENV` to *production*.

### CSS

Lex uses [PostCSS](http://postcss.org/), a tool for transforming CSS. With PostCSS and the included plugins, the following features will be available:

- Use the latest CSS syntax today! No need to wait for browser support.
- Adds vendor prefixes for the last 3 versions of browser releases.
- CSS Modules.
- Minification.
- Use SASS-like variables and nesting.

To add a CSS file to your project, simply import it into the Javascript itself:

```javascript
import './app.css';
```

The following PostCSS plugins are used with Lex:

- [postcss-import](https://github.com/postcss/postcss-import) - Transform @import rules by inlining content.
- [postcss-url](https://github.com/postcss/postcss-url) - Rebase, inline or copy on url().
- [postcss-simple-vars](https://github.com/postcss/postcss-simple-vars) - Use CSS variables inside style classes.
- [postcss-nested](https://github.com/postcss/postcss-nested) - Nest CSS class rules.
- [postcss-cssnext](https://github.com/MoOx/postcss-cssnext) - Use tomorrow's CSS syntax, today.
- [cssnano](http://cssnano.co/) - Minifies and optimizes CSS.
- [postcss-browser-reporter](https://github.com/postcss/postcss-browser-reporter) - Reports warning messages in the browser.

### Images

Images can be included in your code in two ways, via imports or statically. All images within the `./img` directory will be copied to the output folder. This makes it easy to use images the traditional way, inside `img` tags, `<img src="./img/myImage.jpg"/>`, and wintin CSS classes.

The second way is to import them inside the JS code and use them as objects.

```javascript
import myImage from './img/myImage.jpg';

...
render() {
  return <img src={myImage}/>;
}
...
```

### Icons

All SVG icons located in the directory, `./icons`, will be combined and saved as `./icons/icons.svg`. These can be referenced using the SVG name used within your app as:

```html
// ./icons/mySvgName.svg
<svg class="icon">
  <use xlink:href="/icons/icons.svg#mySvgName" />
</svg>
```

### Fonts

Font files within the `./fonts` directory will be copied to the output directory for inclusion in CSS files.

## Troubleshooting

--------

Nothing yet. Having an issue? Report it and We'll get to it as soon as possible!