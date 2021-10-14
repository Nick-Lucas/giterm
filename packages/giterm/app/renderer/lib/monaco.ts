import path from 'path'
import { loader } from '@monaco-editor/react'
import { colours } from 'app/lib/theme'

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

// Configure Monaco instance
export const initialisation = loader.init().then((monaco) => {
  monaco.editor.defineTheme('giterm-dark', {
    base: 'vs-dark',
    inherit: false,
    colors: {
      'editor.background': colours.EDITOR.bg,
      'editor.foreground': colours.EDITOR.white,
    },
    rules: [
      {
        token: '',
        foreground: colours.EDITOR.white,
        background: colours.EDITOR.white,
      },
      { token: 'invalid', foreground: colours.EDITOR.red },
      { token: 'emphasis', fontStyle: 'italic' },
      { token: 'strong', fontStyle: 'bold' },

      { token: 'variable', foreground: colours.EDITOR.blue },
      { token: 'variable.predefined', foreground: colours.EDITOR.blue3 },
      { token: 'constant', foreground: colours.EDITOR.brown },
      { token: 'comment', foreground: colours.EDITOR.dim },
      { token: 'number', foreground: colours.EDITOR.brown },
      { token: 'number.hex', foreground: colours.EDITOR.blue },
      { token: 'regexp', foreground: colours.EDITOR.brown },
      { token: 'annotation', foreground: '#808080' },
      { token: 'type', foreground: colours.EDITOR.green },

      { token: 'delimiter', foreground: colours.EDITOR.white },
      { token: 'delimiter.html', foreground: '#383838' },
      { token: 'delimiter.xml', foreground: colours.EDITOR.blue3 },

      { token: 'tag', foreground: colours.EDITOR.brown },
      { token: 'tag.id.pug', foreground: colours.EDITOR.blue3 },
      { token: 'tag.class.pug', foreground: colours.EDITOR.blue3 },
      { token: 'meta.scss', foreground: colours.EDITOR.brown },
      { token: 'metatag', foreground: colours.EDITOR.brown },
      { token: 'metatag.content.html', foreground: colours.EDITOR.brown },
      { token: 'metatag.html', foreground: '#808080' },
      { token: 'metatag.xml', foreground: '#808080' },
      { token: 'metatag.php', fontStyle: 'bold' },

      { token: 'key', foreground: colours.EDITOR.brown },
      { token: 'string.key.json', foreground: colours.EDITOR.blue3 },
      { token: 'string.value.json', foreground: colours.EDITOR.white },

      { token: 'attribute.name', foreground: colours.EDITOR.brown },
      { token: 'attribute.value', foreground: colours.EDITOR.brown },
      { token: 'attribute.value.number', foreground: colours.EDITOR.brown },
      { token: 'attribute.value.unit', foreground: colours.EDITOR.brown },
      { token: 'attribute.value.html', foreground: colours.EDITOR.blue3 },
      { token: 'attribute.value.xml', foreground: colours.EDITOR.blue3 },

      { token: 'string', foreground: colours.EDITOR.brown },
      { token: 'string.html', foreground: colours.EDITOR.blue3 },
      { token: 'string.sql', foreground: colours.EDITOR.brown },
      { token: 'string.yaml', foreground: colours.EDITOR.brown },

      { token: 'keyword', foreground: colours.EDITOR.blue3 },
      { token: 'keyword.json', foreground: colours.EDITOR.blue },
      { token: 'keyword.flow', foreground: colours.EDITOR.yellow },
      { token: 'keyword.flow.scss', foreground: colours.EDITOR.blue3 },

      { token: 'operator.scss', foreground: '#666666' },
      { token: 'operator.sql', foreground: '#778899' },
      { token: 'operator.swift', foreground: '#666666' },
      { token: 'predefined.sql', foreground: colours.EDITOR.yellow },
    ],
  })
})
