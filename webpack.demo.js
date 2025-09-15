const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

require('dotenv').config({ path: path.resolve(__dirname, 'demo/.env') });

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
      'process.env.CAMUNDA_CLUSTER_ID': JSON.stringify(process.env.CAMUNDA_CLUSTER_ID),
      'process.env.CAMUNDA_CLUSTER_REGION': JSON.stringify(process.env.CAMUNDA_CLUSTER_REGION)
    })
  ],
  resolve: {
    extensions: [ '.js', '.jsx' ]
  },
};