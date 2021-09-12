const packageJson = require('./package.json')

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          electron: packageJson.devDependencies.electron,
        },
      },
    ],
    '@babel/preset-typescript',
    '@babel/preset-react',
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    [
      'module-resolver',
      {
        root: ['.'],
        alias: {
          '^app/(.+)': './app/renderer/\\1',
        },
      },
    ],
  ],
}
