# About

When starting a new app, a lot of time is taken adding development essentials. Each website, app, or component needs to be tested and transpiled. Setting up Babel, Jest, Typescript, and Webpack configurations each time a new project is created takes up time, lots of time. And as the modules are updated, each project needs to be updated and maintained.

Lex eliminates this hassle. With the most common enterprise configurations used, developers can simply run and go. Lex uses the following libraries to assist in development.

- [Babel](https://babeljs.io/)
- [Flow](https://flow.org/)
- [Jest](https://facebook.github.io/jest/)
- [Typescript](http://www.typescriptlang.org/)
- [Webpack](https://webpack.js.org/)

## Transpiling

All source code is transpiled using Babel. Be able to use all the ESNext features of tomorrow, today. Promises, async/await, and arrow functions to name a few. Giving the codebase the potential to expand along with the project and team.

Lex uses Babel with the following presets:

- [@babel/preset-env](https://www.npmjs.com/package/@babel/preset-env)
- [@babel/preset-flow](https://www.npmjs.com/package/@babel/preset-flow)
- [@babel/preset-react](https://www.npmjs.com/package/@babel/preset-react)
- [@babel/preset-typescript](https://www.npmjs.com/package/@babel/preset-typescript)

## Static types

Code is type checking at compile time. While the use of static types is not required, it could help your programming immensely. Using static types within your codebase, will help reduce the amount of minor errors and bugs (typos, standard APIs, etc).

By default, all `.js` files will be checked by Flow. Typescript can be used instead if using the `-t` flag or `useTypescript` in a `lex.config.js` file.

## Building Web Apps

Bundling your web app has never been easier with Webpack 4. With the capability to code split dynamically, segments of code can even be lazy loaded. Lex uses Webpack with a few plugins to take care of the most common app requirements:

- [copy-webpack-plugin](https://www.npmjs.com/package/copy-webpack-plugin) - Copies all static files to output directory. This includes images (*./img*) and fonts (*./fonts*) files.
- [define-plugin](https://webpack.js.org/plugins/define-plugin) - Defines the environment variables.
- [html-webpack-plugin](https://www.npmjs.com/package/html-webpack-plugin) - Embed all scripts in *index.html*.
- [svg-spritemap-webpack-plugin](https://www.npmjs.com/package/svg-spritemap-webpack-plugin) - Include all SVG files in the source to be available via the SVG tag.

## Unit Testing

Unit tests are run using Jest. Jest was made to work particularly well with React and comes with some exciting features including snapshots.
