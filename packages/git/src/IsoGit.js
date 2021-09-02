import path from 'path'
import fs from 'fs'
import igit from 'isomorphic-git'
import ihttp from 'isomorphic-git/http/node'

export class IsoGit {
  constructor(dir) {
    this.props = {
      fs: fs,
      dir: dir,
      gitdir: path.join(dir, '.git'),
    }
  }

  status = () => {
    const matrix = igit.statusMatrix({
      ...this.props,
      filter: (file) => console.log(file),
    })

    return matrix
  }
}
