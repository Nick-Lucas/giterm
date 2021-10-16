import _ from 'lodash'

import type { GetSpawn } from './types'

import type {
  BranchRef,
  GetBranchRefs,
  GetRefsFunc,
  GetTagRefs,
  TagRef,
} from './GitRefs.types'

export class GitRefs {
  _cwd: string
  _getSpawn: GetSpawn

  constructor(cwd: string, getSpawn: GetSpawn) {
    this._cwd = cwd
    this._getSpawn = getSpawn
  }

  getAllBranches = async (options?: Partial<Omit<GetBranchRefs, 'type'>>) => {
    return this.getRefs({
      type: 'branches',
      filter: 'all',
      ...(options ?? {}),
    })
  }

  getAllTags = async (options?: Partial<Omit<GetTagRefs, 'type'>>) => {
    return this.getRefs({
      type: 'tags',
      ...(options ?? {}),
    })
  }

  getRefs: GetRefsFunc = async (
    query: GetBranchRefs | GetTagRefs,
  ): Promise<any> => {
    const spawn = await this._getSpawn()
    if (!spawn) {
      if (query.type == 'branches') {
        return {
          type: query.type,
          query: query,
          refs: [],
        }
      } else {
        return {
          type: query.type,
          query,
          refs: [],
        }
      }
    }

    const filterPatterns: string[] = []
    if (query.type === 'branches') {
      switch (query.filter) {
        case 'all': {
          filterPatterns.push('refs/heads')
          filterPatterns.push('refs/remotes')
          break
        }
        case 'local': {
          filterPatterns.push('refs/heads')
          break
        }
        case 'remote': {
          filterPatterns.push('refs/remotes')
          break
        }
      }
    } else if (query.type === 'tags') {
      filterPatterns.push('refs/tags')
    }

    const SEP_GIT = '%00'
    const SEP_JS = '\0'
    const LINE_START_JS = '\0LINESTART\0'
    const format = [
      '%00LINESTART',
      '%(HEAD)',
      '%(objectname)',
      '%(refname)',
      '%(refname:short)',
      '%(authordate:unix)',
      '%(committerdate:unix)',
      '%(upstream)',
      '%(upstream:short)',
      '%(upstream:track)',
    ]

    const fragments = [
      'for-each-ref',
      `--format=${format.join(SEP_GIT)}`,
      `--sort=${query.sort ?? '-committerdate'}`,
      `--sort=refname`,
      typeof query.limit === 'number' &&
        query.limit > 0 &&
        `count=${query.limit}`,
      ...filterPatterns,
    ].filter(Boolean) as string[]

    const result = await spawn(fragments)

    type RefTuple = [
      isHead: '*' | '',
      sha: string,
      refId: string,
      refName: string,
      authorDate: string,
      commitDate: string,
      upstreamId: string,
      upstreamName: string,
      upstreamDiff: string,
    ]
    const tuples = result
      .split(/\r\n|\r|\n/g)
      .filter((line) => line.startsWith(LINE_START_JS))
      .map((str) => str.replace(LINE_START_JS, '').split(SEP_JS)) as RefTuple[]

    if (query.type === 'branches') {
      const refs: BranchRef[] = []

      const seenUpstreamIdToRefIndex: Record<string, number> = {}
      const discardQueue: number[] = []

      for (let i = 0; i < tuples.length; i++) {
        let [
          isHead,
          sha,
          refId,
          refName,
          authorDate,
          commitDate,
          upstreamId,
          upstreamName,
          upstreamDiff,
        ] = tuples[i]

        let upstreamSha: string | undefined = undefined

        // Remote branches can show up in the first fields when not being tracked locally
        // We just move them to the remote elements and move on
        if (refId?.startsWith('refs/remotes')) {
          upstreamSha = sha
          upstreamId = refId
          upstreamName = refName
          refId = ''
          refName = ''
        }

        const isLocal = !!refId
        const isUpstream = !!upstreamId

        // Ensure that remote refs do not appear twice, once against a local ref and once on their own
        if (!!upstreamId) {
          const seenRefIndex = seenUpstreamIdToRefIndex[upstreamId]
          if (seenRefIndex >= 0 && isLocal) {
            // If we've already seen the branch ref but this time it's with a local reference,
            //  later we need to remove the previously seen version so we can add this (better) one without introducing duplicates
            const remoteRef = refs[seenRefIndex]
            discardQueue.push(seenRefIndex)

            // We also copy over the sha so that diverged branches can be easily searched by sha on both local and remote refs
            upstreamSha = remoteRef.sha
          } else if (seenRefIndex >= 0) {
            // In this scenario the other reference is going to be a local one and is the better reference so we bail on this ref

            // but not before we copy in the upstream sha from here
            const localRef = refs[seenRefIndex]
            if (localRef.upstream) {
              localRef.upstream.sha = upstreamSha
            }

            continue
          }

          // We're about to create this index and may need to check it in the future
          seenUpstreamIdToRefIndex[upstreamId] = refs.length
        }

        const ahead = parseInt(/ahead (\d+)/.exec(upstreamDiff)?.[1] ?? '0')
        const behind = parseInt(/behind (\d+)/.exec(upstreamDiff)?.[1] ?? '0')

        const ref: BranchRef = {
          sha: sha,
          isHead: isHead === '*',
          local: isLocal
            ? {
                id: refId,
                name: refName,
              }
            : undefined,
          upstream: isUpstream
            ? {
                sha: upstreamSha,
                id: upstreamId,
                name: upstreamName,
                ahead: ahead,
                behind: behind,
              }
            : undefined,
          authorDate: authorDate,
          commitDate: commitDate,
        }

        refs.push(ref)
      }

      // Process refs queued for discarding
      for (let i = discardQueue.length - 1; i >= 0; i--) {
        refs.splice(i, 1)
      }

      return {
        type: query.type,
        query: query,
        refs: refs,
      }
    } else {
      const refs = tuples.map<TagRef>((segments) => {
        const [, sha, refId, refName, authorDate, commitDate] = segments

        return {
          sha: sha,
          id: refId,
          name: refName,
          authorDate: authorDate,
          commitDate: commitDate,
        }
      })

      return {
        type: query.type,
        query: query,
        refs: refs,
      }
    }
  }
}
