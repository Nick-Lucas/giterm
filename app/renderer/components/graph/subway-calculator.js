import { Link } from './models/link'
import { Node } from './models/node'
import { SubwayMap } from './models/subway-map'
import { Color } from './models/color'
import BranchLinesCalculator from './branchlines-calculator'

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
      node.secondColor = null

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
        node.secondColor = null

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

    this.updateMapLayout(this.currentMap)
    this.currentMap.links.pop()
    return this.currentMap
  }

  updateMapLayout(map) {
    const branchLinesCalc = new BranchLinesCalculator()

    map.nodes.forEach((node, i) => {
      node.y = START_Y + i * this.rowHeight
      branchLinesCalc.includeNode(node, i)
    })

    // style branch lines
    const branchLines = branchLinesCalc.retrieve()
    branchLines.forEach((branchLine, i) => {
      branchLine.forEachNode((node, nodeI) => {
        const activeLines = branchLinesCalc.numberOfActiveLinesAt(i, nodeI)
        node.x = START_X + activeLines * X_SEPARATION
        node.color.setHex(this.colors[i % this.colors.length])
      }, this)
    }, this)
  }
}
