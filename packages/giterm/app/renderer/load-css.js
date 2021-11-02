import path from 'path'
const xtermJsPath = require.resolve('xterm')
const xtermRootDir = path.normalize(path.join(path.dirname(xtermJsPath), '../'))

function createCSS(href) {
  const xterm = document.createElement('link')
  xterm.rel = 'stylesheet'
  xterm.href = href
  document.head.appendChild(xterm)
}

createCSS(path.relative(__dirname, path.join(xtermRootDir, 'css/xterm.css')))
