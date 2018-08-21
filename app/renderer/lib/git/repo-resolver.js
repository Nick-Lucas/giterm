import fs from 'fs'
import path from 'path'

export default (cwd) => {
  let wd = cwd
  while (wd !== '/') {
    if (fs.existsSync(path.join(wd, '.git'))) {
      return wd
    }
    wd = path.resolve(wd, '..')
  }
  return wd
}
