import _ from 'lodash'

function commitToNode(commit, column, primaryColour, secondaryColour = null) {
  return {
    type: 'node',
    sha: commit.sha,
    deleted: false,
    orphan: commit.parents.length === 0,
    primaryColour,
    secondaryColour,
    column,
  }
}

export function _link(
  y1,
  x1,
  y2,
  x2,
  colour,
  childSha,
  parentSha,
  { nodeAtStart = true, nodeAtEnd = true } = {},
) {
  return {
    x1,
    y1,
    x2,
    y2,
    colour,
    childSha,
    parentSha,
    nodeAtStart,
    nodeAtEnd,
  }
}

class Cursor {
  constructor() {
    this.head = []
    this.workingCopy = []
  }

  getChild = (column) => {
    return this.head[column]
  }

  findChildren = (parentSha) => {
    const children = []
    for (const column in this.head) {
      const trackedCommit = this.head[column]
      if (trackedCommit && trackedCommit.parentSha === parentSha) {
        children.push([parseInt(column), this.head[column]])
      }
    }

    return _.sortBy(children, ([childColumn, child]) => [
      child.parentIndex,
      childColumn,
    ])
  }

  updateColumn = (
    column,
    row,
    sha,
    parentSha,
    allParents,
    colour,
    { symlink = null } = {},
  ) => {
    this.workingCopy[column] = {
      sha,
      parentSha,
      allParents: [...allParents],
      foundParents: [],
      parentIndex: allParents.indexOf(parentSha),
      colour,
      isNode: true,
      row,
      symlink,
    }

    return column
  }

  markParentFound = (column, parentSha) => {
    this.workingCopy[column].foundParents.push(parentSha)
  }

  assignColumn = (
    row,
    sha,
    parentSha,
    allParents,
    colour,
    { symlink = null } = {},
  ) => {
    const columns = this.findChildren(sha).filter(
      ([, child]) => child.parentIndex === 0,
    )
    if (columns.length > 0) {
      throw 'Coding error: Do not use assignColumn when a direct  child already exists'
    }

    let column = 0
    for (; column <= this.workingCopy.length; column++) {
      if (this.workingCopy[column] === undefined) {
        break
      }
    }

    return this.updateColumn(column, row, sha, parentSha, allParents, colour, {
      symlink,
    })
  }

  next = (nextRowIndex) => {
    const links = []

    // Commit to head
    this.head = this.workingCopy
    this.workingCopy = this.workingCopy.map((columnObj) => ({
      ..._.cloneDeep(columnObj),
      isNode: false,
    }))

    // Clean up
    for (const index in this.head) {
      const { foundParents, allParents } = this.head[index]
      if (foundParents.length === allParents.length) {
        this.head[index] = undefined
      }
    }

    // Generate links
    for (const columnStr in this.head) {
      const column = parseInt(columnStr)
      const columnObj = this.head[column]
      if (!columnObj) {
        continue
      }

      const columnFrom = columnObj.symlink === null ? column : columnObj.symlink

      links.push(
        _link(
          nextRowIndex - 1,
          columnFrom,
          nextRowIndex,
          column,
          columnObj.colour,
          columnObj.sha,
          columnObj.parentSha,
          {
            nodeAtStart: columnObj.isNode,
            nodeAtEnd: false,
          },
        ),
      )
    }

    return links
  }
}

class ColourTracker {
  constructor() {
    this._colourIndex = -1
  }

  next = () => ++this._colourIndex
}

function rehydrate({ nodes = [], links = [], cursor = {}, colours = {} }) {
  return {
    nodes,
    links,
    cursor: Object.assign(new Cursor(), cursor),
    colours: Object.assign(new ColourTracker(), colours),
  }
}

export function commitsToGraph(commits = [], rehydrationPackage = {}) {
  const { nodes, links, cursor, colours } = rehydrate(rehydrationPackage)

  function prepareNext() {
    // Carry over any links generated which do not belong in the previous row
    // FIXME: Don't love that this needs to exist, would be better to have a futureRowLinks array which gets merged in later
    const lastRowIndex = links.length - 1
    const linksToShift = []
    if (lastRowIndex >= 0) {
      const lastLinks = links[lastRowIndex]
      for (let i = lastLinks.length - 1; i >= 0; i--) {
        if (lastLinks[i].y1 >= lastRowIndex) {
          linksToShift.push(...lastLinks.splice(i, 1))
        }
      }
    }

    // Move cursor foward to retrieve auto-generated links
    const autoLinks = cursor.next(nodes.length)
    const rowLinks = [...autoLinks, ...linksToShift]

    links.push(rowLinks)

    return {
      rowLinks,
      rowIndex: nodes.length,
    }
  }

  for (const commit of commits) {
    const { rowLinks, rowIndex } = prepareNext()

    function trackNewBranch() {
      let node = null
      const colour = colours.next()

      const column = cursor.assignColumn(
        rowIndex,
        commit.sha,
        commit.parents[0],
        commit.parents,
        colour,
      )

      node = commitToNode(commit, column, colour)
      nodes.push(node)

      for (const parentSha of commit.parents.slice(1)) {
        let colour = null

        const [firstChildOfParentColumn, firstChildOfParent] =
          cursor.findChildren(parentSha)[0] || []
        if (firstChildOfParent && firstChildOfParent.parentIndex === 0) {
          // If this is a merge in from another branch with a colour already chosen
          colour = firstChildOfParent.colour

          rowLinks.push(
            _link(
              rowIndex,
              node.column,
              rowIndex + 1,
              firstChildOfParentColumn,
              colour,
              node.sha,
              firstChildOfParent.parentSha,
              {
                nodeAtStart: true,
                nodeAtEnd: false,
              },
            ),
          )
        } else {
          // If this is a merge in from a new branch not yet discovered
          colour = colours.next()

          // Also assign columns to parents, with a symlink to auto-generated links
          cursor.assignColumn(
            rowIndex,
            commit.sha,
            parentSha,
            commit.parents,
            colour,
            {
              symlink: node.column,
            },
          )
        }

        node.secondaryColour = colour
      }
      return node
    }

    const children = cursor.findChildren(commit.sha)
    if (children.length === 0) {
      trackNewBranch()
    } else {
      // Track known parent which may belong to 1 or more children
      let node = null
      for (const [childColumn, child] of children) {
        cursor.markParentFound(childColumn, commit.sha)

        if (node === null) {
          const colour = child.colour

          node = commitToNode(commit, childColumn, colour)
          nodes.push(node)

          cursor.updateColumn(
            node.column,
            rowIndex,
            commit.sha,
            commit.parents[0],
            commit.parents,
            node.primaryColour,
          )
        }
      }

      if (!node) {
        // TODO: Need to handle new branches appearing
        throw 'Coding error: NODE SHOULD BE SET'
      }

      for (const link of rowLinks) {
        if (link.parentSha === node.sha) {
          link.nodeAtEnd = true
          link.x2 = node.column
        }
      }
    }
  }

  return {
    nodes: nodes.map((node) => {
      // TODO: this is for compatibility, remove this later!
      const row = []
      row[node.column] = node
      for (let col = 0; col < row.length; col++) {
        if (row[col] === undefined) {
          row[col] = {
            type: 'blank',
          }
        }
      }
      return row
    }),
    links,
    commits,
    rehydrationPackage: {
      nodes: [...nodes],
      links: [...links],
      cursor,
      colours,
    },
  }
}
