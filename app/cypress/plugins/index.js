const path = require('path')
const pkg = require('../../../package')

const pathToElectron = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'node_modules',
  '.bin',
  'electron',
)

module.exports = (on, config) => {
  // remove "standard" browsers and use
  // our local Electron as a browser
  config.browsers = [
    {
      name: 'electron',
      family: 'electron',
      displayName: 'Local Electron app',
      version: pkg.version,
      path: pathToElectron,
      // show full package version in the browser dropdown
      majorVersion: `v${pkg.version}`,
      info:
        pkg.description || 'Electron.js app that supports the Cypress launcher',
    },
  ]

  return config
}
