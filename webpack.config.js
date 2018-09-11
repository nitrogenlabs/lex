const {StaticSitePlugin} = require('@nlabs/webpack-plugin-static-site');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const fs = require('fs');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const path = require('path');
const SVGSpritemapPlugin = require('svg-spritemap-webpack-plugin');
const webpack = require('webpack');
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');

const {DefinePlugin, HotModuleReplacementPlugin} = webpack;
const environment = process.env.NODE_ENV || 'development';
const isProduction = environment === 'production';
const nodePath = path.resolve(__dirname, './node_modules');
const lexConfig = JSON.parse(process.env.LEX_CONFIG) || {};
const envVariables = lexConfig.env || {NODE_ENV: environment};
const processVariables = Object.keys(envVariables).reduce((list, varName) => {
  list[`process.env.${varName}`] = JSON.stringify(envVariables[varName]);
  return list;
}, {});

const babelOptions = require(path.resolve(__dirname, './babelOptions.js'));
const {isStatic, outputFullPath, sourceFullPath, outputFile, outputHash, libraryName, libraryTarget} = lexConfig;

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
        loader: path.resolve(`${nodePath}/source-map-loader`),
        test: /\.(js|ts|tsx)$/
      },
      {
        exclude: /(node_modules)/,
        loader: path.resolve(`${nodePath}/babel-loader`),
        options: babelOptions,
        test: /\.(js|ts|tsx)$/
      },
      {
        test: /\.css$/,
        use: [
          path.resolve(`${nodePath}/style-loader`),
          {
            loader: path.resolve(`${nodePath}/css-loader`),
            options: {
              importLoaders: 1
            }
          },
          {
            loader: path.resolve(`${nodePath}/postcss-loader`),
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
            loader: `${nodePath}/html-loader`,
            options: {minimize: isProduction}
          }
        ]
      },
      {
        loader: `${nodePath}/file-loader`,
        test: /\.(png|svg|jpg|gif)$/
      }
    ]
  },
  optimization: {
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
    'react-hot-loader': `${nodePath}/react-hot-loader`,
    webpack: `${nodePath}/webpack`
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

module.exports = webpackConfig;
