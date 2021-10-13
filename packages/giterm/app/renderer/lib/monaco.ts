import path from 'path'
import { loader } from '@monaco-editor/react'

// Export for usage
export * from '@monaco-editor/react'

// Patch Monaco state to prevent load error on electron:
// https://github.com/microsoft/monaco-editor-samples/blob/b9969d41cba002c7e6b9faca33e7b452a49d4545/electron-amd-nodeIntegration/electron-index.html#L36
self.module = undefined as unknown as NodeModule

// Configure react monaco to use locally installed version instead of a CDN copy
const monacoPackageJsonPath = require.resolve('monaco-editor/package.json')
const monacoDir = path.dirname(monacoPackageJsonPath)
loader.config({
  paths: {
    vs: path.join(monacoDir, '/dev/vs'),
  },
})
