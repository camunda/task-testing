module.exports = {
  presets: [
    [ '@babel/preset-env', { targets: { chrome: '85' }, exclude: [ 'transform-async-to-generator' ] } ],
    [ '@babel/preset-react', { runtime: 'automatic' } ]
  ]
};