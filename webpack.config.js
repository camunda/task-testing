module.exports = {
  mode: 'production',
  entry: './lib/index.jsx',
  devtool: 'source-map',
  output: {
    filename: 'index.js',
    library: {
      type: 'module',
      export: 'default'
    },
    clean: true
  },
  experiments: {
    outputModule: true
  },
  externals: {
    react: 'react',
    'react/jsx-runtime': 'react/jsx-runtime',
    'react/jsx-dev-runtime': 'react/jsx-dev-runtime',
    'react-dom': 'react-dom',
    'react-dom/server': 'react-dom/server',
    '@carbon/react': '@carbon/react',
    '@carbon/icons-react': '@carbon/icons-react'
  },
  resolve: {
    extensions: [ '.js', '.jsx' ]
  },
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
      }
    ]
  },
};