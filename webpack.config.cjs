const CamundaModelerWebpackPlugin = require('camunda-modeler-webpack-plugin');

const path = require('path');

module.exports = {
  mode: 'production',
  entry: './lib/index.jsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: {
      type: 'module',
    },
    clean: true
  },
  experiments: {
    outputModule: true
  },
  resolve: {
    extensions: [ '.js', '.jsx', '.scss' ]
  },
  externals: {
    react: 'react',
    'react-dom': 'react-dom',
    'camunda-bpmn-js': 'camunda-bpmn-js',
  },
  plugins: [
    new CamundaModelerWebpackPlugin(),
  ],
  module: {
    rules: [
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
    ]
  },
  devtool: 'eval-source-map'
};