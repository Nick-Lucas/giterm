const uniqWith = require('lodash/uniqWith')
const isEqual = require('lodash/isEqual')
const sortBy = require('lodash/sortBy')

/** Commit
  {
    sha: '7eef151bf46f22ce1908cbe14861747d32e2d3a1',
    sha7: '7eef15',
    parents: [
      '5dca9d5c8daac7f1f400802689d35a1cd888e0a8'
    ],

    isHead: false,
    message: '',
    detail: '',
    date: '2019-09-02T15:06:26.000Z',
    dateStr: '2019/09/02 16:06',
    time: 1567436786,
    committer: {},
    email: '',
    author: '',
    authorStr: ''
  },
 */

function cloneNodeAsBlank(node) {
  return {
    ...node,
    type: 'blank'
  }
}

function commitToNode(commit, primaryColour, secondaryColour=null) {
  return {
    type: 'node',
    sha: commit.sha,
    deleted: false,
    orphan: commit.parents.length === 0,
    primaryColour, 
    secondaryColour
  }
}

export function _link(y1, x1, y2, x2, colour) {
  return {
    x1, 
    y1, 
    x2, 
    y2,
    colour
  }
}

// Keep a track of where children are by their parent shas
class ChildDirectory {
  constructor() {
    // object for parents to look up if any children are searching for them
    this._lookup = {}

    // object of all children and their parents still being searched for
    this._tracked = {}
  }

  register = (sha, parentShas, row, column) => {
    this._tracked[sha] = parentShas

    for (let parentIndex = 0; parentIndex < parentShas.length; parentIndex++) {
      const parentSha = parentShas[parentIndex]
      if (!this._lookup[parentSha]) {
        this._lookup[parentSha] = []
      }
  
      this._lookup[parentSha].push({row, column, parentIndex, sha})
    }
  }

  lookup = (parentSha) => {
    return sortBy(
      this._lookup[parentSha] || [], 
      child => [child.parentIndex, child.column]
    )
  }

  lookupRemainingParents = (childSha) => {
    return this._tracked[childSha] || []
  }

  spliceColumn = (column) => {
    for (const sha in this._lookup) {
      for (const item of this._lookup[sha]) {
        if (item.column > column) {
          item.column -= 1
        }
      }
    }
  }

  cleanup = (parentSha) => {
    delete this._lookup[parentSha]

    for (const sha in this._tracked) {
      const parentIndex = this._tracked[sha].indexOf(parentSha)
      if (parentIndex >= 0) {
        this._tracked[sha].splice(parentIndex, 1)
        if (this._tracked[sha].length === 0) {
          delete this._tracked[sha]
        }
      }
    }
  }
}

class ColourTracker {
  constructor() {
    this._colourIndex = -1
  }

  next = () => ++this._colourIndex
}

export function commitsToGraph(commits=[], rehydrationPackage = {}) {
  const {
    children = new ChildDirectory(),
    colours = new ColourTracker(),
    nodes = [],
    links = []
  } = rehydrationPackage

  function prepareNext() {
    const last = nodes[nodes.length-1] || []
    const next = last.map(cloneNodeAsBlank)
    nodes.push(next)
    
    // generate initial links
    const rowNumber = nodes.length-1
    const rowLinks = next.map((node, i) => _link(
      rowNumber - 1,
      i,
      rowNumber,
      i,
      node.primaryColour
    ))
    links.push(rowLinks)

    // Remove deleted nodes which no longer need tracking and update columns
    for (let i = next.length-1; i >= 0; i--) {
      if (next[i].deleted || next[i].orphan) {
        next.splice(i, 1)

        rowLinks.splice(i, 1)
        for (let rl = i; rl < rowLinks.length; rl++) {
          if (rowLinks[rl].x2 > i) rowLinks[rl].x2 -= 1
        }

        children.spliceColumn(i)
      }
    }

    return {last, next, rowNumber, rowLinks}
  }
  
  for (const commit of commits) {
    const {next, rowNumber, rowLinks} = prepareNext()

    // A merge or branch point might be more than 1 commit away, 
    //  so we have to write links from the merge to the current row
    function writeLinks(fromY, fromX, toY, toX, colour) {
      links[fromY+1].push(
        _link(
          fromY,
          fromX,
          fromY+1,
          toX,
          colour
        )
      )

      for (let row = fromY+1; row < toY; row ++) {
        links[row+1].push(
          _link(
            row,
            toX,
            row+1,
            toX,
            colour
          )
        )
      }
    }

    function trackNewBranch(childRow=null, childColumn=null) {
      const colour = colours.next()
      const column = next.push(commitToNode(commit, colour)) - 1
      children.register(commit.sha, commit.parents, rowNumber, column)

      if (childRow != null && childColumn != null) {
        nodes[childRow][childColumn].secondaryColour = colour
        writeLinks(childRow, childColumn, rowNumber, column, colour)
      }
    }

    function trackKnownParent(column) {
      next[column] = commitToNode(commit, next[column].primaryColour)
      children.register(commit.sha, commit.parents, rowNumber, column)
    }

    function trackOtherChildLinks(childSha, childColumn, childRow, destinationColumn, colour) {
      if (childColumn >= next.length) {
        throw new Error("Invariant: column < next.length evaluated to false")
      }

      const childHasAnotherParent = children.lookupRemainingParents(childSha).length > 1
      if (childHasAnotherParent) {
        writeLinks(childRow, childColumn, rowNumber, destinationColumn, colour)
      } else {
        next[childColumn].deleted = true
        rowLinks[childColumn].x2 = destinationColumn
      }
    }
    
    const registeredChildren = children.lookup(commit.sha)
    if (registeredChildren.length === 0) {
      trackNewBranch()
    } else {
      // Track which column this commit ends up in, as it may be needed later
      let nodeColumn = null
      
      for (let i = 0; i < registeredChildren.length; i++) {
        const coords = registeredChildren[i]
        
        if (i === 0 && coords.parentIndex === 0) {
          // Found direct parent of existing child
          nodeColumn = coords.column
          trackKnownParent(coords.column)
        } else if (i === 0 && coords.parentIndex !== 0) {
          // Found merged-in parent
          nodeColumn = coords.column
          trackNewBranch(coords.row, coords.column)
        } else {
          // Found child branched off from parent
          if (nodeColumn == null) {
            throw "Invariant: nodeColumn was null, time to use a queue to ensure it's always populated first"
          }

          const childNode = nodes[coords.row][coords.column]
          const colour = coords.parentIndex === 0
            ? childNode.primaryColour 
            : next[nodeColumn].primaryColour
          if (childNode.primaryColour !== colour) {
            childNode.secondaryColour = colour
          }

          trackOtherChildLinks(coords.sha, coords.column, coords.row, nodeColumn, colour)
        }
      }
    }

    // Keep the child directory minimal
    children.cleanup(commit.sha)
  }

  // TODO: optimise this by making each links row a Set with 
  //        understanding of its data, to avoid a second iteration over the whole lot
  for (const i in links) {
    links[i] = uniqWith(links[i], isEqual)
  }

  return { 
    nodes,
    links,
    commits,
    rehydrationPackage: {
      nodes: [...nodes],
      links: [...links],
      children,
      colours
    }
  }
}
