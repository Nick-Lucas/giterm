const fs = require('fs')
const path = require('path')

const excludeProjects = ['giterm-e2e']

const packagesDir = path.join(__dirname, 'packages')
const projectNames = fs
  .readdirSync(packagesDir, {
    withFileTypes: true,
  })
  .filter((file) => file.isDirectory())
  .map((dir) => dir.name)
  .filter((dirName) => !excludeProjects.includes(dirName))
  .map((dirName) => path.join('packages', dirName))

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  projects: projectNames,
}
