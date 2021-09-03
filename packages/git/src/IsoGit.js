import path from 'path'
import fs from 'fs'
import igit from 'isomorphic-git'

const el = {
  filename: 0,
  head: 1,
  workdir: 2,
  stage: 3,
}

const head = {
  absent: 0,
  present: 1,
}

const workdir = {
  absent: 0,
  identical: 1,
  modified: 2,
}

const stage = {
  absent: 0,
  matchesHead: 1,
  matchesWorkdir: 2,
  differentToWorkdir: 3,
}

export class IsoGit {
  constructor(dir) {
    this.props = {
      fs: fs,
      dir: dir,
      gitdir: path.join(dir, '.git'),
    }
  }

  status = async () => {
    // Docs: https://isomorphic-git.org/docs/en/statusMatrix
    const matrix = await igit.statusMatrix({
      ...this.props,
    })

    return matrix
      .filter((data) => data[el.workdir] !== workdir.identical) // No unchanged files
      .map((data) => {
        const isNew =
          data[el.head] === head.absent && data[el.workdir] === workdir.modified
        const isDeleted =
          data[el.head] === head.present && data[el.workdir] === workdir.absent
        const isModified =
          data[el.head] === head.present &&
          data[el.workdir] === workdir.modified
        

        let staged = false
        let unstaged = false
        if (isDeleted) {
          staged = data[el.stage] === 0
          unstaged = !staged
        } else if (isModified) {
          staged = data[el.stage] === stage.matchesWorkdir || data[el.stage] === stage.differentToWorkdir
          unstaged = data[el.stage] === stage.matchesHead || data[el.stage] === stage.differentToWorkdir
        } else {
          staged = data[el.stage] === stage.matchesWorkdir || data[el.stage] === stage.differentToWorkdir
          unstaged = !staged
        } 

        return {
          path: data[el.filename],
          staged: staged,
          unstaged: unstaged,
          isNew: isNew,
          isDeleted: isDeleted,
          isModified: isModified,
          raw: data
        }
      })
  }
}
