const packageJson = require('./package.json')

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          electron: packageJson.devDependencies.electron,
        },
        // "useBuiltIns": 'usage'
      },
    ],
    '@babel/preset-react',
  ],
  plugins: ['@babel/plugin-proposal-class-properties'],
}
