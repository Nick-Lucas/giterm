import os from 'os'
import fs from 'fs'
import path from 'path'
import child_process from 'child_process'
import { Git } from './Git'
import { STATE } from './constants'

const tmp = os.tmpdir()

const getSpawn = (cwd) => async (args) => {
  const buffers = []
  const child = child_process.spawn('git', args, { cwd })

  return new Promise((resolve) => {
    child.stdout.on('data', (data) => {
      buffers.push(data)
    })

    child.stderr.on('data', (data) => {
      buffers.push(data)
    })

    child.on('close', () => {
      resolve(String(Buffer.concat(buffers)))
    })
  })
}

describe('Git', () => {
  let dir = ''
  let spawn = getSpawn(dir)

  function writeFile(name, text) {
    const filePath = path.join(dir, name)
    fs.writeFileSync(filePath, text, { encoding: 'utf8' })
  }

  function rmFile(name) {
    const filePath = path.join(dir, name)
    if (fs.existsSync(filePath)) {
      throw new `'${name}' does not exist in dir ${dir}`()
    }

    fs.unlinkSync(filePath)
  }

  async function commit(text) {
    await spawn(['add', '--all'])
    await spawn([`commit`, `-m "${text}"`])
    const sha = await spawn([`rev-parse`, `HEAD`])

    return sha.trim()
  }

  beforeEach(async () => {
    dir = fs.mkdtempSync(path.join(tmp, 'giterm-git-'))
    spawn = getSpawn(dir)
  })

  describe('getStateText', () => {
    it('has no repo', async () => {
      const git = new Git(dir)
      const result = await git.getStateText()
      expect(result).toBe(STATE.NO_REPO)
    })

    it('is ok', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      const result = await git.getStateText()
      expect(result).toBe(STATE.OK)
    })

    it('is rebasing', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      // We create a rebase conflict between two branches
      await spawn(['checkout', '-b', 'branch-a'])
      writeFile('f1', 'abc')
      await commit('First Commit')
      await spawn(['checkout', '-b', 'branch-b'])
      writeFile('f1', 'cba')
      await commit('Second Commit')
      await spawn(['checkout', 'branch-a'])
      writeFile('f1', 'abccba')
      await commit('Third Commit')
      await spawn(['rebase', 'branch-b'])

      const result = await git.getStateText()
      expect(result).toBe(STATE.REBASING)
    })

    it('is merging', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      // We create a merge conflict between two branches
      await spawn(['checkout', '-b', 'branch-a'])
      writeFile('f1', 'abc')
      await commit('First Commit')
      await spawn(['checkout', '-b', 'branch-b'])
      writeFile('f1', 'cba')
      await commit('Second Commit')
      await spawn(['checkout', 'branch-a'])
      writeFile('f1', 'abccba')
      await commit('Third Commit')
      await spawn(['merge', 'branch-b'])

      const result = await git.getStateText()
      expect(result).toBe(STATE.MERGING)
    })

    it('is cherry-picking', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      // We create a merge conflict between two branches
      await spawn(['checkout', '-b', 'branch-a'])
      writeFile('f1', 'abc')
      await commit('First Commit')
      await spawn(['checkout', '-b', 'branch-b'])
      writeFile('f1', 'cba')
      await commit('Second Commit')
      await spawn(['checkout', 'branch-a'])
      writeFile('f1', 'abccba')
      await commit('Third Commit')
      await spawn(['cherry-pick', 'branch-b'])

      const result = await git.getStateText()
      expect(result).toBe(STATE.CHERRY_PICKING)
    })

    it.todo('is applying mailbox')
    it.todo('is reverting')
    it.todo('is bisecting')
  })
})
