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
    if (!fs.existsSync(filePath)) {
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
      writeFile('f1.txt', 'abc')
      await commit('First Commit')
      await spawn(['checkout', '-b', 'branch-b'])
      writeFile('f1.txt', 'cba')
      await commit('Second Commit')
      await spawn(['checkout', 'branch-a'])
      writeFile('f1.txt', 'abccba')
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
      writeFile('f1.txt', 'abc')
      await commit('First Commit')
      await spawn(['checkout', '-b', 'branch-b'])
      writeFile('f1.txt', 'cba')
      await commit('Second Commit')
      await spawn(['checkout', 'branch-a'])
      writeFile('f1.txt', 'abccba')
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
      writeFile('f1.txt', 'abc')
      await commit('First Commit')
      await spawn(['checkout', '-b', 'branch-b'])
      writeFile('f1.txt', 'cba')
      await commit('Second Commit')
      await spawn(['checkout', 'branch-a'])
      writeFile('f1.txt', 'abccba')
      await commit('Third Commit')
      await spawn(['cherry-pick', 'branch-b'])

      const result = await git.getStateText()
      expect(result).toBe(STATE.CHERRY_PICKING)
    })

    it.todo('is applying mailbox')
    it.todo('is reverting')
    it.todo('is bisecting')
  })

  describe('getHeadSHA', () => {
    it('works for no repo', async () => {
      const git = new Git(dir)
      const sha = await git.getHeadSHA()
      expect(sha).toBe('')
    })

    it('returns sha on branch', async () => {
      await spawn(['init'])
      writeFile('f1.txt', 'abc')
      const commitSha = await commit('Initial commit')

      const git = new Git(dir)
      const sha = await git.getHeadSHA()
      expect(sha).toHaveLength(40)
      expect(sha).toBe(commitSha)
    })

    it('returns sha when detached', async () => {
      await spawn(['init'])
      writeFile('f1.txt', 'abc')
      await commit('Initial commit')
      writeFile('f1.txt', 'abcd')
      const commitSha = await commit('Second commit')
      await spawn(['checkout', commitSha])

      const git = new Git(dir)
      const sha = await git.getHeadSHA()
      expect(sha).toHaveLength(40)
      expect(sha).toBe(commitSha)
    })
  })

  describe('getStatus', () => {
    it('works for no repo', async () => {
      const git = new Git(dir)

      const status = await git.getStatus()
      expect(status).toEqual([])
    })

    it.each(['staged', 'unstaged'])('lists %s new file', async (stagedKey) => {
      await spawn(['init'])
      const git = new Git(dir)
      writeFile('f1.txt', 'abcdefg')
      if (stagedKey === 'staged') {
        await spawn(['add', '--all'])
      }

      const status = await git.getStatus()

      delete status[0].raw
      expect(status).toEqual([
        {
          path: 'f1.txt',
          staged: stagedKey === 'staged',
          unstaged: stagedKey === 'unstaged',
          isNew: true,
          isDeleted: false,
          isModified: false,
        },
      ])
    })

    it.each(['staged', 'unstaged'])(
      'lists %s modified file',
      async (stagedKey) => {
        await spawn(['init'])
        const git = new Git(dir)

        writeFile('f1.txt', 'abcdefg')
        await commit('Initial Commit')
        writeFile('f1.txt', 'abcdef')
        if (stagedKey === 'staged') {
          await spawn(['add', '--all'])
        }

        const status = await git.getStatus()

        delete status[0].raw
        expect(status).toEqual([
          {
            path: 'f1.txt',
            staged: stagedKey === 'staged',
            unstaged: stagedKey === 'unstaged',
            isNew: false,
            isDeleted: false,
            isModified: true,
          },
        ])
      },
    )

    it.each(['staged', 'unstaged'])(
      'lists %s deleted file',
      async (stagedKey) => {
        await spawn(['init'])
        const git = new Git(dir)

        writeFile('f1.txt', 'abcdefg')
        await commit('Initial Commit')
        rmFile('f1.txt')
        if (stagedKey === 'staged') {
          await spawn(['add', '--all'])
        }

        const status = await git.getStatus()

        delete status[0].raw
        expect(status).toEqual([
          {
            path: 'f1.txt',
            staged: stagedKey === 'staged',
            unstaged: stagedKey === 'unstaged',
            isNew: false,
            isDeleted: true,
            isModified: false,
          },
        ])
      },
    )

    it('lists a combination of files', async () => {
      await spawn(['init'])
      const git = new Git(dir)

      writeFile('f1.txt', 'abcdefg')
      writeFile('f2.txt', 'abcdefg')
      writeFile('f3.txt', 'abcdefg')
      await commit('Initial Commit')
      rmFile('f1.txt')
      writeFile('f2.txt', 'abc')
      writeFile('f4.txt', 'jnasd')

      const status = await git.getStatus()

      for (const file of status) {
        delete file.raw
      }
      expect(status).toEqual([
        {
          path: 'f1.txt',
          staged: false,
          unstaged: true,
          isNew: false,
          isDeleted: true,
          isModified: false,
        },
        {
          path: 'f2.txt',
          staged: false,
          unstaged: true,
          isNew: false,
          isDeleted: false,
          isModified: true,
        },
        {
          path: 'f4.txt',
          staged: false,
          unstaged: true,
          isNew: true,
          isDeleted: false,
          isModified: false,
        },
      ])
    })
  })
})
