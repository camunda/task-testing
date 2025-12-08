const path = require('path');
const dotenv = require('dotenv');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './demo/index.jsx',
  output: {
    path: path.resolve(__dirname, 'demo/public'),
    clean: true
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.bpmn$/i,
        use: 'raw-loader'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './demo/index.html'
    }),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(dotenv.config({ path: path.resolve(__dirname, 'demo/.env') }).parsed)
    })
  ],
  resolve: {
    extensions: [ '.js', '.jsx' ]
  },
};