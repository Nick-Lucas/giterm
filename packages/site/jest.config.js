const base = require('../../jest.config.base')

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  ...base,
  name: 'Site',
  testPathIgnorePatterns: [
    '/node_modules/',
    __dirname + '/dist',
    __dirname + '/.cache',
    __dirname + '/public',
  ],
}
