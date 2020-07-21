// https://www.xfree86.org/4.8.0/ctlseqs.html

// Used by vim, ie. interactive rebase
export const isStartAlternateBuffer = (data) => data.match(/\[\?47h/)
export const isEndAlternateBuffer = (data) => data.match(/\[\?47l/)

// Used by `git diff` command for scrolling around the output
export const isStartAppKeysMode = (data) => data.match(/\[\?1h=/)
export const isEndAppKeysMode = (data) => data.match(/\[\?1l/)
