const CamundaModelerWebpackPlugin = require('camunda-modeler-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './lib/index.jsx',
  devtool: 'source-map',
  output: {
    filename: 'index.js',
    library: {
      type: 'umd',
      export: 'default',
    },
    globalObject: 'this',
    clean: true
  },
  resolve: {
    extensions: [ '.js', '.jsx' ]
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
};