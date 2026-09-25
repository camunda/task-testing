const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const envFile = fs.existsSync(path.resolve(__dirname, 'demo/.env')) ? 'demo/.env' : 'demo/.env.example';

const { CAMUNDA_OPERATE_BASE_URL, CAMUNDA_TASKLIST_BASE_URL } = dotenv.config({ path: path.resolve(__dirname, envFile) }).parsed || {};

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
        test: /\.(bpmn|form|html)$/i,
        use: 'raw-loader'
      },
      {
        test: /\.(woff2?|ttf|eot)$/i,
        type: 'asset/resource'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './demo/index.html'
    }),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify({ CAMUNDA_OPERATE_BASE_URL, CAMUNDA_TASKLIST_BASE_URL })
    })
  ],
  resolve: {
    extensions: [ '.js', '.jsx' ]
  },
};