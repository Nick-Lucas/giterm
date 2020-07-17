const package = require('./package.json')

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          electron: package.devDependencies.electron,
        },
        // "useBuiltIns": 'usage'
      },
    ],
    '@babel/preset-react',
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties'
  ],
}
