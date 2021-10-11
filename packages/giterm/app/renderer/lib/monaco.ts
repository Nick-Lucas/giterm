
import path from 'path'
import { loader } from '@monaco-editor/react'

// Export for usage
export * from '@monaco-editor/react'

// Import to ensure bundler includes the dependency
import * as monacoEditor from "monaco-editor/package.json"
monacoEditor === monacoEditor

// Configure react monaco to use locally installed version instead of a CDN copy
const monacoPackageJsonPath = require.resolve("monaco-editor/package.json")
const monacoDir = path.dirname(monacoPackageJsonPath)
loader.config({
  paths: {
    vs: path.join(monacoDir, '/min/vs')
  }
})
