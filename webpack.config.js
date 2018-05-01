const {CheckerPlugin} = require('awesome-typescript-loader');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const SVGSpritemapPlugin = require('svg-spritemap-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

const environment = process.env.NODE_ENV || 'development';
const isProduction = environment === 'production';
const lexPath = path.resolve(__dirname, './node_modules');
const lexConfig = JSON.parse(process.env.LEX_CONFIG);

const webpackConfig = {
  devServer: {
    historyApiFallback: true,
    noInfo: false
  },
  devtool: !isProduction && 'cheap-module-eval-source-map',
  entry: {
    index: `${lexConfig.sourceDir}/${lexConfig.entryFile}`
  },
  mode: environment,
  module: {
    rules: [
      {
        loader: `${lexPath}/awesome-typescript-loader`,
        test: /\.tsx?$/
      },
      {
        enforce: 'pre',
        loader: `${lexPath}/source-map-loader`,
        test: /\.js$/
      },
      {
        test: /\.css$/,
        use: [
          `${lexPath}/style-loader`,
          {
            loader: `${lexPath}/css-loader`, options: {
              importLoaders: 1
            }
          },
          {
            loader: `${lexPath}/postcss-loader`, options: {
              plugins: [
                require('postcss-import')({addDependencyTo: webpack}),
                require('postcss-url'),
                require('postcss-simple-vars'),
                require('postcss-nested'),
                require('postcss-cssnext')({
                  browser: ['last 3 versions']
                }),
                require('cssnano')({autoprefixer: false}),
                require('postcss-browser-reporter'),
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
  // optimization: {
  //   runtimeChunk: false,
  //   splitChunks: {chunks: 'all'}
  // },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, lexConfig.outputDir)
  },
  plugins: [
    new CleanWebpackPlugin([lexConfig.outputDir]),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(environment)
    }),
    new CheckerPlugin(),
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
      template: `${lexConfig.sourceDir}/index.html`
    })
  ],
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.jsx']
  }
};

module.exports = webpackConfig;
