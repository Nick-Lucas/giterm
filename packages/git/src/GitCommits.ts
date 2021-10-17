import _ from 'lodash'
import { createHash } from 'crypto'

import { Git } from './Git'
import type { GetSpawn } from './types'
import { perfStart } from './performance'

import { Commits, Commit, LoadCommits } from './GitCommits.types'

export class GitCommits {
  _cwd: string
  _getSpawn: GetSpawn
  private git: Git

  constructor(cwd: string, getSpawn: GetSpawn, git: Git) {
    this._cwd = cwd
    this._getSpawn = getSpawn
    this.git = git
  }

  load = async (opts?: LoadCommits): Promise<Commits> => {
    if (!opts) {
      opts = {
        includeRemote: true,
        paging: {
          start: 0,
          count: 500,
        },
      }
    }

    const headSha = await this.git.getHeadSHA()
    if (!headSha) {
      return {
        query: opts,
        commits: [],
        digest: '',
      }
    }

    const spawn = await this._getSpawn()
    if (!spawn) {
      return {
        query: opts,
        commits: [],
        digest: '',
      }
    }

    const SEP = '----e16409c0-8a85-4a6c-891d-8701f48612d8----'
    const FORMAT_SEGMENTS_COUNT = 6
    const cmd = [
      '--no-pager',
      'log',
      `--format=%H${SEP}%P${SEP}%aN${SEP}%aE${SEP}%aI${SEP}%s`,
      '--branches=*',
      '--tags=*',
      opts.includeRemote && '--remotes=*',
      `--skip=${opts.paging.start}`,
      `--max-count=${opts.paging.count}`,
      `--date-order`,
    ].filter(Boolean) as string[]

    const perfSpawn = perfStart('GIT/log/spawn')
    const result = await spawn(cmd)
    perfSpawn.done()

    const perfSanitise = perfStart('GIT/log/sanitise-result')
    const tuples = result
      .split(/\r\n|\r|\n/g)
      .filter(Boolean)
      .map((str) => str.split(SEP))
    perfSanitise.done()

    const perfDeserialise = perfStart('GIT/log/deserialise')
    const commits = new Array<Commit>(tuples.length)
    const hash = createHash('sha1')
    for (let i = 0; i < tuples.length; i++) {
      const formatSegments = tuples[i]
      if (formatSegments.length !== FORMAT_SEGMENTS_COUNT) {
        throw `Separator ${SEP} in output, cannot parse git history. ${formatSegments.length} segments found, ${FORMAT_SEGMENTS_COUNT} expected. Values: ${formatSegments}`
      }

      const [
        sha,
        parentShasStr,
        authorName,
        authorEmail,
        authorDateISO,
        subject,
      ] = formatSegments
      const parentShas = parentShasStr.split(' ').filter(Boolean)
      const author = `${authorName} <${authorEmail}>`

      commits[i] = {
        sha: sha,
        sha7: sha.substring(0, 7),
        message: subject.trim(),
        dateISO: authorDateISO,
        email: authorEmail,
        author: authorName,
        authorStr: author,
        parents: parentShas,
        isHead: headSha === sha,
      }

      hash.update(sha)
    }
    perfDeserialise.done()

    const perfFinalise = perfStart('GIT/digest-finalise')
    const digest = hash.digest('hex')
    perfFinalise.done()

    return {
      query: opts,
      commits: commits,
      digest: digest,
    }
  }
}
