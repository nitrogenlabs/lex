---
id: setup
title: Setup
---

## Environment Variables

Environment variables can be a very important part of your app. They can dynamically set configuration values your JS app can use later during runtime. Custom variables can be set in the lex configuration.

The environment variable, `process.env.NODE_ENV` is usually used to determine what environment the app is running in. When running `lex dev`, `NODE_ENV` will be set to *development*, and `lex build` will set `NODE_ENV` to *production*.

## CSS

Lex uses [PostCSS](http://postcss.org/), a tool for transforming CSS. With PostCSS and the included plugins, the following features will be available:

- Use the latest CSS syntax today! No need to wait for browser support.
- Adds vendor prefixes for the last 3 versions of browser releases.
- CSS Modules.
- Minification.
- Use SASS-like variables and nesting.

To add a CSS file to your project, simply import it into the Javascript itself:

```js
import './app.css';
```

The following PostCSS plugins are used with Lex:

- [cssnano](http://cssnano.co/) - Minifies and optimizes CSS.
- [postcss-browser-reporter](https://github.com/postcss/postcss-browser-reporter) - Reports warning messages in the browser.
- [postcss-import](https://github.com/postcss/postcss-import) - Transform @import rules by inlining content.
- [postcss-nested](https://github.com/postcss/postcss-nested) - Nest CSS class rules.
- [postcss-preset-env](https://github.com/csstools/postcss-preset-env) - Converts modern CSS into something most browsers can understand, determining the polyfills needed based on targeted browsers or runtime environments.
- [postcss-simple-vars](https://github.com/postcss/postcss-simple-vars) - Use CSS variables inside style classes.
- [postcss-url](https://github.com/postcss/postcss-url) - Rebase, inline or copy on url().

## Images

Images can be included in your code in two ways, via imports or statically. All images within the `./img` directory will be copied to the output folder. This makes it easy to use images the traditional way, inside `img` tags, `<img src="./img/myImage.jpg"/>`, and wintin CSS classes.

The second way is to import them inside the JS code and use them as objects.

```js
import myImage from './img/myImage.jpg';

...
render() {
  return <img src={myImage}/>;
}
...
```

## Icons

All SVG icons located in the directory, `./icons`, will be combined and saved as `./icons/icons.svg`. These can be referenced using the SVG name used within your app as:

```html
// ./icons/mySvgName.svg
<svg class="icon">
  <use xlink:href="/icons/icons.svg#mySvgName" />
</svg>
```

## Fonts

Font files within the `./fonts` directory will be copied to the output directory for inclusion in CSS files.
