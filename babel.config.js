module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          electron: '7.1',
        },
        // "useBuiltIns": 'usage'
      },
    ],
    '@babel/preset-react',
  ],
  plugins: [
    // "transform-decorators-legacy",
    '@babel/plugin-proposal-class-properties',
    // "transform-object-rest-spread",
    // "transform-runtime"
  ],
}
