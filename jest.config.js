const packageJson = require('./package.json')

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  projects: packageJson.workspaces.packages,
}
