export class TestGitBuilder {
  constructor() {
    this._commits = [this._createCommit({ id: 'root' })]
    this._index = {
      root: 0,
    }
    this._headIndex = 0
  }

  _createCommit({ id = null, parents = [] }) {
    const sha = generateSha()
    // const sha7 = sha.slice(0, 7)
    return {
      _id: id,
      sha,
      parents,
      // sha7,
      // message: '',
      // isHead: false
      // detail: '',
      // date: '2019-09-02T15:06:26.000Z',
      // dateStr: '2019/09/02 16:06',
      // time: 1567436786,
      // committer: {},
      // email: '',
      // author: '',
      // authorStr: '',
    }
  }

  _getChildIndex = (childId = null, allowMissing = false) => {
    if (!childId) {
      return this._commits.length - 1
    }

    const index = this._index[childId]
    if (index >= 0) {
      return index
    }

    if (allowMissing) {
      return -1
    }

    throw new Error('ID ' + childId + ' has not been added yet')
  }

  addCommit = ({ id = null, parentId = null, orphan = false } = {}) => {
    const getParentShas = () => {
      if (orphan) {
        return []
      }

      const parentIndex = this._getChildIndex(parentId)
      const parent = this._commits[parentIndex]
      return [parent.sha]
    }

    const commit = this._createCommit({ id, parents: getParentShas() })
    const index = this._commits.push(commit) - 1

    if (id) {
      // Keep a trailed latest on each ID
      this._index[id] = index
    }

    return commit
  }

  addMerge = ({
    id = null,
    parentId1 = null,
    parentId2 = null,
    explicitParent2IsMissing = false,
  } = {}) => {
    const parentIndex1 = this._getChildIndex(parentId1)
    const parentIndex2 = this._getChildIndex(
      parentId2,
      explicitParent2IsMissing,
    )
    const parent1Sha = this._commits[parentIndex1].sha
    const parent2Sha = explicitParent2IsMissing
      ? parentId2
      : this._commits[parentIndex2].sha

    const commit = this._createCommit({
      id,
      parents: [parent1Sha, parent2Sha],
    })
    const index = this._commits.push(commit) - 1

    if (id) {
      // Keep a trailed latest on each ID
      this._index[id] = index
    }

    return commit
  }

  getCommits = () => [...this._commits].reverse()
}

// For this we don't really care about sha1 hashing, but that we get a SHA-like string
// https://stackoverflow.com/questions/10726909/random-alpha-numeric-string-in-javascript
function generateSha() {
  const length = 40
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
  let result = ''
  for (var i = length; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}
