const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const SVGSpritemapPlugin = require('svg-spritemap-webpack-plugin');
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

const environment = process.env.NODE_ENV || 'development';
const isProduction = environment === 'production';
const lexPath = path.resolve(__dirname, './node_modules');
const lexConfig = JSON.parse(process.env.LEX_CONFIG) || {};
const envVariables = lexConfig.env || {NODE_ENV: environment};
const processVariables = Object.keys(envVariables).reduce((list, varName) => {
  list[`process.env.${varName}`] = JSON.stringify(envVariables[varName]);
  return list;
}, {});

const babelOptions = require(path.resolve(__dirname, './babelOptions.js'));
const babelPolyfillPath = path.resolve(__dirname, './node_modules/babel-polyfill/lib/index.js');
const {outputFullPath, sourceFullPath} = lexConfig;

// Only add plugins if they are needed
const plugins = [
  new CleanWebpackPlugin([outputFullPath], {allowExternal: true}),
  new webpack.DefinePlugin(processVariables),
  new SVGSpritemapPlugin({
    filename: './icons/icons.svg',
    prefix: '',
    src: `${sourceFullPath}/**/*.svg`
  })
];

// If there is are static directories, make sure we copy the files over
const staticPaths = [];

if(fs.existsSync(`${sourceFullPath}/img/`)) {
  staticPaths.push({from: `${sourceFullPath}/img/`, to: './img/'});
}

if(fs.existsSync(`${sourceFullPath}/fonts/`)) {
  staticPaths.push({from: `${sourceFullPath}/fonts/`, to: './fonts/'});
}

if(staticPaths.length) {
  plugins.push(new CopyWebpackPlugin(staticPaths));
}

if(fs.existsSync(`${sourceFullPath}/${lexConfig.entryHTML}`)) {
  plugins.push(new HtmlWebPackPlugin({
    filename: './index.html',
    template: `${sourceFullPath}/${lexConfig.entryHTML}`
  }));
}

const webpackConfig = {
  bail: true,
  cache: !isProduction,
  entry: {
    babelPolyfill: babelPolyfillPath,
    index: `${sourceFullPath}/${lexConfig.entryJS}`
  },
  mode: environment,
  module: {
    rules: [
      {
        enforce: 'pre',
        loader: path.resolve(`${lexPath}/source-map-loader`),
        test: /\.(js|ts|tsx)$/
      },
      {
        exclude: /(node_modules)/,
        loader: path.resolve(`${lexPath}/babel-loader`),
        options: babelOptions,
        test: /\.(js|ts|tsx)$/
      },
      {
        test: /\.scss$/,
        use: [
          require.resolve(`${lexPath}/style-loader`),
          require.resolve(`${lexPath}/css-loader`),
          {
            loader: path.resolve(`${lexPath}/postcss-loader`),
            options: {
              ident: 'postcss',
              plugins: () => [
                require('postcss-custom-properties')({
                  preserve: true,
                  strict: false,
                  warnings: false
                }),
                require('postcss-flexbugs-fixes'),
                require('postcss-preset-env')({
                  browsers: ['last 5 versions'],
                  stage: 0
                }),
                require('cssnano')({autoprefixer: false, safe: true}),
                require('postcss-browser-reporter')
              ]
            }
          },
          {
            loader: require.resolve(`${lexPath}/sass-loader`),
            options: {
              includePaths: ['./node_modules']
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          path.resolve(`${lexPath}/style-loader`),
          {
            loader: path.resolve(`${lexPath}/css-loader`),
            options: {
              importLoaders: 1
            }
          },
          {
            loader: path.resolve(`${lexPath}/postcss-loader`),
            options: {
              plugins: [
                require('postcss-import')({addDependencyTo: webpack}),
                require('postcss-url'),
                require('postcss-custom-properties')({
                  preserve: false,
                  strict: false,
                  warnings: false
                }),
                require('postcss-simple-vars'),
                require('postcss-nesting'),
                require('postcss-flexbugs-fixes'),
                require('postcss-preset-env')({
                  browsers: ['last 5 versions'],
                  stage: 0
                }),
                require('cssnano')({autoprefixer: false}),
                require('postcss-browser-reporter')
              ]
            }
          }
        ]
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: `${lexPath}/html-loader`,
            options: {minimize: isProduction}
          }
        ]
      },
      {
        loader: `${lexPath}/file-loader`,
        test: /\.(png|svg|jpg|gif)$/
      }
    ]
  },
  output: {
    filename: '[name].js',
    path: outputFullPath
  },
  plugins,
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  }
};

if(!isProduction) {
  webpackConfig.devServer = {historyApiFallback: true, noInfo: false};
  webpackConfig.devtool = 'cheap-module-eval-source-map';
}

module.exports = webpackConfig;
