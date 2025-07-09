module.exports = function(config) {

  config.set({
    frameworks: [
      'webpack',
      'mocha',
      'sinon-chai'
    ],
    files: [
      'test/**/*.spec.js',
    ],
    preprocessors: {
      ['test/**/*.spec.js']: [ 'webpack', 'env' ]
    },
    browsers: [ 'ChromeHeadless' ],
    singleRun: true,
    webpack: {
      mode: 'development',
      devtool: 'inline-source-map',
      module: {
        rules: [
          {
            test: /\.(js|jsx)$/,
            exclude: /node_modules/,
            use: 'babel-loader'
          },
          {
            test: /\.css$/,
            use: [ 'style-loader', 'css-loader' ]
          }
        ]
      },
      resolve: {
        extensions: [ '.js', '.jsx' ]
      }
    }
  });
};