const path = require('path')
const base = require('../../jest.config.base')

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  ...base,
  name: 'GitermE2E',
  globalSetup: path.join(__dirname, 'config/setup.ts'),
  testTimeout: 120000,
  forceExit: true,
}
