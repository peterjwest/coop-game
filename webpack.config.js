const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const SassPlugin = require('sass-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  entry: ['./src/index.ts'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    filename: 'index.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  externals : {
    nodegit: 'require("nodegit")'
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.ts$/,
        loaders: ['tslint-loader'],
        exclude: /node_modules/
      },
      {
        test: /\.ts$/,
        loaders: ['ts-loader'],
        exclude: /node_modules/,
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              context: 'src',
              name: '[path][name].[ext]'
            },
          },
          {
            loader: 'image-webpack-loader'
          },
        ],
      },
      {
        test: /\.(woff|woff2|ttf|eot)$/i,
        loader: 'file-loader',
        options: {
          context: 'src',
          name: '[path][name].[ext]'
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin([path.join('dist', '*')]),
    new CopyWebpackPlugin([{
      from: 'src/index.html',
      to: 'index.html',
    }]),
    new CopyWebpackPlugin([{
      from: 'src/images',
      to: 'images',
    }]),
    new SassPlugin('src/styles/index.scss', {
      sourceMap: true,
      sass: { outputStyle: 'compressed' },
      autoprefixer: true
    }),
  ],
};
