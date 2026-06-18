// configures browsers to run test against
// any of [ 'ChromeHeadless', 'Chrome', 'Firefox' ]
const browsers = (process.env.TEST_BROWSERS || 'ChromeHeadless').split(',');

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
    reporters: [ 'tldr' ],
    browsers,
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
            test: /\.scss$/,
            use: [
              'style-loader',
              'css-loader',
              'sass-loader'
            ]
          },
          {
            test: /\.bpmn$/i,
            use: 'raw-loader'
          }
        ]
      },
      resolve: {
        extensions: [ '.js', '.jsx' ]
      }
    }
  });
};