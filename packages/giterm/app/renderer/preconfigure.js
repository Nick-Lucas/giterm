import path from 'path'

function createCSS(href) {
  const xterm = document.createElement('link')
  xterm.rel = 'stylesheet'
  xterm.href = href
  document.head.appendChild(xterm)
}
const xtermJsPath = require.resolve('xterm')
const xtermRootDir = path.normalize(path.join(path.dirname(xtermJsPath), '../'))
createCSS(path.relative(__dirname, path.join(xtermRootDir, 'css/xterm.css')))

if (!!process.env.E2E) {
  window.spectronRequire = require
}
