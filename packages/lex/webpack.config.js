/**
 * Copyright (c) 2018, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
const {StaticSitePlugin} = require('@nlabs/webpack-plugin-static-site');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const fs = require('fs');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const path = require('path');
const SVGSpritemapPlugin = require('svg-spritemap-webpack-plugin');
const webpack = require('webpack');
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');

const {relativeFilePath} = require('./dist/utils');

const {DefinePlugin, HotModuleReplacementPlugin} = webpack;
const environment = process.env.NODE_ENV || 'development';
const isProduction = environment === 'production';
const lexConfig = JSON.parse(process.env.LEX_CONFIG) || {};
const envVariables = lexConfig.env || {NODE_ENV: environment};
const processVariables = Object.keys(envVariables).reduce((list, varName) => {
  list[`process.env.${varName}`] = JSON.stringify(envVariables[varName]);
  return list;
}, {});

const babelOptions = require(path.resolve(__dirname, './babelOptions.js'));
const {
  isStatic,
  outputFullPath,
  sourceFullPath,
  outputFile,
  outputHash,
  libraryName,
  libraryTarget,
  webpack: webpackCustom
} = lexConfig;

// Only add plugins if they are needed
const plugins = [
  new DefinePlugin(processVariables),
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

if(fs.existsSync(`${sourceFullPath}/docs/`)) {
  staticPaths.push({from: `${sourceFullPath}/docs/`, to: './docs/'});
}

if(staticPaths.length) {
  plugins.push(new CopyWebpackPlugin(staticPaths));
}

// Create site ico files
const siteLogo = `${sourceFullPath}/img/logo.png`;

if(fs.existsSync(siteLogo)) {
  plugins.push(new FaviconsWebpackPlugin({
    icons: {
      android: true,
      appleIcon: true,
      appleStartup: false,
      coast: false,
      favicons: true,
      firefox: false,
      opengraph: true,
      twitter: true,
      windows: false,
      yandex: false
    },
    logo: siteLogo
  }));
}

if(fs.existsSync(`${sourceFullPath}/${lexConfig.entryHTML}`)) {
  plugins.push(new HtmlWebPackPlugin({
    filename: './index.html',
    template: `${sourceFullPath}/${lexConfig.entryHTML}`
  }));
}

let outputFilename = outputFile;

if(outputFile) {
  outputFilename = outputFile;
} else if(outputHash) {
  outputFilename = '[name].[hash].js';
} else {
  outputFilename = '[name].js';
}

// Loader paths
const sourceLoaderPath = relativeFilePath('node_modules/source-map-loader', __dirname);
const babelLoaderPath = relativeFilePath('node_modules/babel-loader', __dirname);
const styleLoaderPath = relativeFilePath('node_modules/style-loader', __dirname);
const cssLoaderPath = relativeFilePath('node_modules/css-loader', __dirname);
const postcssLoaderPath = relativeFilePath('node_modules/postcss-loader', __dirname);
const htmlLoaderPath = relativeFilePath('node_modules/html-loader', __dirname);
const fileLoaderPath = relativeFilePath('node_modules/file-loader', __dirname);
const reactHotLoaderPath = relativeFilePath('node_modules/react-hot-loader', __dirname);
const webpackPath = relativeFilePath('node_modules/webpack', __dirname);

// Webpack config
const webpackConfig = {
  bail: true,
  cache: !isProduction,
  entry: {
    index: `${sourceFullPath}/${lexConfig.entryJS}`
  },
  mode: environment,
  module: {
    rules: [
      {
        enforce: 'pre',
        loader: sourceLoaderPath,
        test: /\.(js|ts|tsx)$/
      },
      {
        exclude: /(node_modules)/,
        loader: babelLoaderPath,
        options: babelOptions,
        test: /\.(js|ts|tsx)$/
      },
      {
        test: /\.css$/,
        use: [
          styleLoaderPath,
          {
            loader: cssLoaderPath,
            options: {
              importLoaders: 1
            }
          },
          {
            loader: postcssLoaderPath,
            options: {
              plugins: [
                require('postcss-import')({addDependencyTo: webpack}),
                require('postcss-url'),
                require('postcss-for'),
                require('postcss-percentage')({
                  floor: true,
                  precision: 9,
                  trimTrailingZero: true
                }),
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
            loader: htmlLoaderPath,
            options: {minimize: isProduction}
          }
        ]
      },
      {
        loader: fileLoaderPath,
        test: /\.(png|svg|jpg|gif)$/
      }
    ]
  },
  optimization: libraryName ? {} : {
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendor: {
          chunks: 'all',
          name: 'vendors',
          test: /[\\/]node_modules[\\/]/
        }
      }
    }
  },
  output: {
    filename: outputFilename,
    library: libraryName,
    libraryTarget,
    path: outputFullPath,
    publicPath: '/'
  },
  plugins,
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  }
};

// Add development plugins
if(!isProduction) {
  webpackConfig.resolve.alias = {
    'react-hot-loader': reactHotLoaderPath,
    webpack: webpackPath
  };
  webpackConfig.plugins.push(
    new HotModuleReplacementPlugin(),
    new BundleAnalyzerPlugin({openAnalyzer: false}),
  );
  webpackConfig.devServer = {
    historyApiFallback: true,
    hotOnly: true,
    noInfo: false,
    port: 9000
  };
  webpackConfig.devtool = 'inline-source-map';
} else if(isStatic) {
  webpackConfig.plugins.push(new StaticSitePlugin(), new webpack.HashedModuleIdsPlugin());
}

module.exports = {...webpackConfig, ...webpackCustom};
