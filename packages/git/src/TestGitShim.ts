import os from 'os'
import fs from 'fs'
import path from 'path'
import child_process from 'child_process'

export class TestGitShim {
  readonly dir: string

  constructor() {
    const tmp = os.tmpdir()
    this.dir = fs.mkdtempSync(path.join(tmp, 'giterm-git-'))
  }

  getSpawn =
    (cwd?: string) =>
    async (
      args: string[],
      { errorOnNonZeroExit = true } = {},
    ): Promise<string> => {
      const buffers: Buffer[] = []
      const child = child_process.spawn('git', args, { cwd: cwd ?? this.dir })

      return new Promise((resolve, reject) => {
        child.stdout.on('data', (data) => {
          buffers.push(data)
        })

        child.stderr.on('data', (data) => {
          buffers.push(data)
        })

        child.on('close', (code) => {
          if (code != 0 && errorOnNonZeroExit) {
            const text = String(Buffer.concat(buffers))
            console.error(text)
            reject(text)
          } else {
            resolve(String(Buffer.concat(buffers)))
          }
        })
      })
    }

  waitToFixGitTime = async (ms = 500) => {
    await new Promise((r) => setTimeout(r, ms))
  }

  writeFile = (name: string, text: string) => {
    const filePath = path.join(this.dir, name)
    fs.writeFileSync(filePath, text, { encoding: 'utf8' })
  }

  renameFile = (name: string, newName: string) => {
    fs.renameSync(path.join(this.dir, name), path.join(this.dir, newName))
  }

  rmFile = (name: string) => {
    const filePath = path.join(this.dir, name)
    if (!fs.existsSync(filePath)) {
      throw `'${name}' does not exist in dir ${this.dir}`
    }

    fs.unlinkSync(filePath)
  }

  commit = async (text: string) => {
    const spawn = await this.getSpawn()
    await spawn(['add', '--all'])
    await spawn([`commit`, `-m`, text])
    const sha = await spawn([`rev-parse`, `HEAD`])

    return sha.trim()
  }

  createRemote = async () => {
    const tmp = os.tmpdir()
    const remoteDir = fs.mkdtempSync(path.join(tmp, 'giterm-git-remote-'))
    const remoteFile = 'remote.git'

    const remoteSpawn = this.getSpawn(remoteDir)
    await remoteSpawn(['init', '--bare', remoteFile])

    return path.join(remoteDir, remoteFile)
  }
}
