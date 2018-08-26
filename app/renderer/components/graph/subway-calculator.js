import { Link } from './models/link'
import { Node } from './models/node'
import { SubwayMap } from './models/subway-map'

import { Color } from './models/color'

const START_X = 10
const START_Y = 12
const X_SEPARATION = 15

export class SubwayCalculator {
  colors = [
    '#058ED9',
    '#880044',
    '#875053',
    '#129490',
    '#E5A823',
    '#0055A2',
    '#96C5F7',
  ]
  currentMap = null

  constructor(rowHeight) {
    this.rowHeight = rowHeight
  }

  getSubwayMap(commits) {
    const _infinityY = this.rowHeight * (commits.length + 1)
    const nodeDict = {}
    const nodes = []
    const links = []
    const that = this

    // Initialise default nodes for each commit
    commits.forEach((c) => {
      const node = new Node(c.sha)
      node.y = START_Y
      node.x = START_X
      node.commit = c
      node.color = Color.parseHex(that.colors[0])
      node.secondColor = Color.parseHex(that.colors[0])

      nodes.push(node)
      nodeDict[node.commit.sha] = node
    }, this)

    // Initialise connecting lines
    commits.forEach((commit) => {
      if (commit.parents.length === 0) {
        const infinityNode = new Node('infty-' + commit.sha)
        infinityNode.x = nodeDict[commit.sha].x
        infinityNode.y = _infinityY

        const link = new Link(nodeDict[commit.sha], infinityNode)
        link.color = nodeDict[commit.sha].color

        links.push(link)
      } else {
        commit.parents.forEach((parentSha) => {
          const parent = nodeDict[parentSha]
          if (parent) {
            const link = new Link(nodeDict[commit.sha], parent)

            if (commit.parents.length > 1) {
              link.color = parent.color
              nodeDict[commit.sha].secondColor = parent.color
              link.merge = true
            } else {
              link.color = nodeDict[commit.sha].color
              link.merge = false
            }

            links.push(link)
          }
        })
      }
    })
    links.pop()

    this.currentMap = new SubwayMap(nodes, links, nodeDict)
    this.updateMapLayout(this.currentMap)
    return this.currentMap
  }

  updateCommits(commits) {
    if (!this.currentMap) {
      return
    }

    const nodes = this.currentMap.nodes
    const nodeDict = this.currentMap.nodeDict

    // remove non-existant commits
    const shas = commits.map((c) => c.sha)
    const oldShas = Object.keys(nodeDict)
    oldShas.forEach((sha) => {
      if (shas.indexOf(sha) > -1) {
        return
      }

      nodes.splice(nodes.indexOf(nodeDict[sha]), 1)
      delete nodeDict[sha]
    })

    // add new commits
    let i = 0
    let j = 0
    // newCommits will be >= than old nodes now
    // since we remove all nodes in old that's not in new
    while (i < commits.length || j < nodes.length) {
      if (j >= nodes.length || nodes[j].commit.sha !== commits[i].sha) {
        // if node is not in already, create new one
        const node = new Node(commits[i].sha)
        node.y = START_Y
        node.x = START_X
        node.commit = commits[i]
        node.color = Color.parseHex(this.colors[0])
        node.secondColor = Color.parseHex(this.colors[0])

        if (j < nodes.length) {
          nodes.splice(j, 0, node)
        } else {
          nodes.splice(nodes.length, 0, node)
        }
        nodeDict[node.commit.sha] = node
      }
      j += 1
      i += 1
    }

    nodes.map((n) => {
      n.processed = false
    })
    this.currentMap.links = []

    // edge creation
    const _infinityY = this.rowHeight * (nodes.length + 1)
    nodes.forEach((n) => {
      const commit = n.commit
      if (commit.parents.length === 0) {
        const infinityNode = new Node('infty-' + commit.sha)
        infinityNode.x = nodeDict[commit.sha].x
        infinityNode.y = _infinityY

        const newLink = new Link(nodeDict[commit.sha], infinityNode)
        newLink.color = nodeDict[commit.sha].color

        this.currentMap.links.push(newLink)
      } else {
        commit.parents.forEach((parentSha) => {
          const parent = nodeDict[parentSha]
          if (parent) {
            const link = new Link(nodeDict[commit.sha], parent)

            if (commit.parents.length > 1) {
              link.color = parent.color
              nodeDict[commit.sha].secondColor = parent.color
              link.merge = true
            } else {
              link.color = nodeDict[commit.sha].color
              link.merge = false
            }

            this.currentMap.links.push(link)
          }
        })
      }
    })
    this.currentMap.links.pop()

    this.updateMapLayout(this.currentMap)
    return this.currentMap
  }

  updateMapLayout(map) {
    const nodes = map.nodes
    const nodeDict = map.nodeDict
    // New x algorithm, branch lines, closed and open concept
    // let's see, start from top, start a "branch line" and add that commit, mark as open
    // a merge commit comes in, add one parent in it's line, add another to "new branch", mark open
    // a commit is removed from nodeDict if processed
    // any new commits, add to a existing branch if "its sha is any of existing's parent", if all fail, put it in new branch line
    // a branch line can only close if "a commit with only 1 parent and that parent is already in a branch" comes in
    const branchLines = []

    function placeNodeInNewOrClosed(node) {
      let addedToBl = null
      branchLines.forEach((bl) => {
        if (node.processed) {
          return
        }

        if (!bl.open) {
          addedToBl = bl
          bl.nodes.push(node)
          bl.open = true
          node.processed = true
        }
      })

      if (!addedToBl) {
        // still can't add, create a new branchline
        branchLines.push({ nodes: [node], open: true })
        addedToBl = branchLines[branchLines.length - 1]
        node.processed = true
      }

      return addedToBl
    }

    function placeNodeInExisting(node) {
      // if node is the parent of some branchline we append it
      let addedToBl = null
      branchLines.forEach((bl) => {
        if (
          !node.processed &&
          bl.nodes[bl.nodes.length - 1].commit.parents[0] === node.commit.sha
        ) {
          addedToBl = bl
          bl.nodes.push(node)
          node.processed = true
        }
      })
      return addedToBl
    }

    function processParents(n, bl) {
      // pecial case for it's parents, always put the first with itself
      const parent0 = nodeDict[n.commit.parents[0]]
      let processGrandparent0 = false
      if (parent0 && !parent0.processed) {
        bl.nodes.push(parent0)
        if (nodeDict[n.commit.parents[0]].commit.parents.length > 1) {
          processGrandparent0 = true
        }
        nodeDict[n.commit.parents[0]].processed = true
      }
      // if there's a second parent, try to place that too
      const parent1 = nodeDict[n.commit.parents[1]]
      let newbl
      let processGrandparent = false
      if (parent1 && !parent1.processed) {
        if (!placeNodeInExisting(parent1)) {
          if (parent1.commit.parents.length > 1) {
            processGrandparent = true
          }
          newbl = placeNodeInNewOrClosed(parent1)
        }
      }
      if (processGrandparent0) {
        processParents(nodeDict[n.commit.parents[0]], bl)
      }
      if (processGrandparent) {
        processParents(parent1, newbl)
      }
    }

    nodes.forEach((node, i) => {
      node.y = START_Y + i * this.rowHeight

      if (!node.processed) {
        const branchLine =
          placeNodeInExisting(node) || placeNodeInNewOrClosed(node)
        processParents(node, branchLine)
      }

      // close finished branchlines
      branchLines.forEach((bl) => {
        if (last(bl.nodes).commit.parents.indexOf(node.commit.sha) > -1) {
          bl.open = false
        }
      })
    })

    // style branch lines
    branchLines.forEach((bl, i) => {
      bl.nodes.forEach((n) => {
        n.x = START_X + i * X_SEPARATION
        n.color.setHex(this.colors[i % this.colors.length])
        n.x_order = i
      })
    }, this)

    map.width = branchLines.length
  }
}

function last(array) {
  return array[array.length - 1]
}
