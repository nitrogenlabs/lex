const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const SVGSpritemapPlugin = require('svg-spritemap-webpack-plugin');
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

const webpackConfig = {
  bail: true,
  cache: !isProduction,
  devServer: {
    historyApiFallback: true,
    noInfo: false
  },
  devtool: !isProduction && 'cheap-module-eval-source-map',
  entry: {
    index: `${lexConfig.sourceDir}/${lexConfig.entryJS}`
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
          require.resolve('style-loader'),
          require.resolve('css-loader'),
          {
            loader: require.resolve('postcss-loader'),
            options: {
              ident: 'postcss',
              plugins: () => [
                require('postcss-custom-properties')({
                  preserve: true,
                  strict: false,
                  warnings: false
                }),
                require('postcss-flexbugs-fixes'),
                require('postcss-cssnext')({
                  browser: ['last 3 versions'],
                  features: {
                    customProperties: {
                      warnings: false
                    }
                  }
                }),
                require('cssnano')({autoprefixer: false, safe: true}),
                require('postcss-browser-reporter')
              ]
            }
          },
          {
            loader: require.resolve('sass-loader'),
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
                require('postcss-custom-properties')({
                  preserve: true,
                  strict: false,
                  warnings: false
                }),
                require('postcss-import')({addDependencyTo: webpack}),
                require('postcss-url'),
                require('postcss-simple-vars'),
                require('postcss-nested'),
                require('postcss-flexbugs-fixes'),
                require('postcss-cssnext')({
                  browser: ['last 3 versions'],
                  features: {
                    customProperties: {
                      warnings: false
                    }
                  }
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
    path: path.resolve(__dirname, lexConfig.outputDir)
  },
  plugins: [
    new CleanWebpackPlugin([lexConfig.outputDir], {allowExternal: true}),
    new webpack.DefinePlugin(processVariables),
    new CopyWebpackPlugin([
      {from: `${lexConfig.sourceDir}/fonts/`, to: './fonts/'},
      {from: `${lexConfig.sourceDir}/img/`, to: './img/'}
    ]),
    new SVGSpritemapPlugin({
      filename: './icons/icons.svg',
      prefix: '',
      src: `${lexConfig.sourceDir}/**/*.svg`
    }),
    new HtmlWebPackPlugin({
      filename: './index.html',
      template: `${lexConfig.sourceDir}/${lexConfig.entryHTML}`
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  }
};

module.exports = webpackConfig;
