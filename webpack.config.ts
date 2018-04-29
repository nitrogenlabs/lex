import {CheckerPlugin} from 'awesome-typescript-loader';
import * as CleanWebpackPlugin from 'clean-webpack-plugin';
import * as CopyWebpackPlugin from 'copy-webpack-plugin';
import * as HtmlWebPackPlugin from 'html-webpack-plugin';
import * as SVGSpritemapPlugin from 'svg-spritemap-webpack-plugin';
import * as path from 'path';
import * as webpack from 'webpack';
import {LexConfigType} from './lib/LexConfig';

const environment: string = process.env.NODE_ENV || 'development';
const isProduction: boolean = environment === 'production';
const lexPath: string = path.resolve(__dirname, './node_modules');
const lexConfig: LexConfigType = JSON.parse(process.env.LEX_CONFIG);

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

export default webpackConfig;
