function createCSS(href) {
  const xterm = document.createElement('link')
  xterm.rel = 'stylesheet'
  xterm.href = href
  document.head.appendChild(xterm)
}

createCSS(
  process.env.NODE_ENV === 'development'
    ? '../../../../node_modules/xterm/css/xterm.css'
    : '../../node_modules/xterm/css/xterm.css',
)
