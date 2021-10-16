import _ from 'lodash'

import type { GetSpawn } from './types'

export type RefSort = 'refname' | '-committerdate'

export interface GetBranchRefs {
  type: 'branches'
  filter: 'all' | 'local' | 'remote'
  sort?: RefSort
  limit?: number
}

export interface GetTagRefs {
  type: 'tags'
  sort?: RefSort
  limit?: number
}

export interface RefLocal {
  id: string
  name: string
}

export interface RefRemote {
  id: string
  name: string
  ahead: number
  behind: number
}

export interface BranchRef {
  isHead: boolean
  sha: string
  local: RefLocal | false
  authorDate: string
  commitDate: string
  upstream: RefRemote | false
}

export interface TagRef {
  id: string
  name: string
  sha: string
  commitDate: string
  authorDate: string
}

export interface BranchRefs {
  type: 'branches'
  query: GetBranchRefs
  refs: BranchRef[]
}

export interface TagRefs {
  type: 'tags'
  query: GetTagRefs
  refs: TagRef[]
}

export type GetRefsFunc = {
  (query: GetTagRefs): Promise<TagRefs>
  (query: GetBranchRefs): Promise<BranchRefs>
}

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

        // Remote branches can show up in the first fields when not being tracked locally
        // We just move them to the remote elements and move on
        if (refId?.startsWith('refs/remotes')) {
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
            //  we need to remove the previously seen version so we can add this (better) one without introducing duplicates
            refs.splice(seenRefIndex, 1)
          } else if (seenRefIndex >= 0) {
            // In this scenario the other reference is going to be a local one and is the better reference so we bail on this ref
            continue
          }

          // We're about to create this index and may need to check it in the future
          seenUpstreamIdToRefIndex[upstreamId] = tuples.length
        }

        const ahead = parseInt(/ahead (\d+)/.exec(upstreamDiff)?.[1] ?? '0')
        const behind = parseInt(/behind (\d+)/.exec(upstreamDiff)?.[1] ?? '0')

        const ref: BranchRef = {
          sha: sha,
          isHead: isHead === '*',
          local: isLocal && {
            id: refId,
            name: refName,
          },
          upstream: isUpstream && {
            id: upstreamId,
            name: upstreamName,
            ahead: ahead,
            behind: behind,
          },
          authorDate: authorDate,
          commitDate: commitDate,
        }

        refs.push(ref)
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
