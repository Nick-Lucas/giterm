import { Link } from './models/link'
import { Node } from './models/node'
import { SubwayMap } from './models/subway-map'
import { Color } from './models/color'
import BranchLinesCalculator from './branchlines-calculator'

export const START_X = 10
export const START_Y = 12
export const X_SEPARATION = 15

export const Colours = [
  '#058ED9',
  '#880044',
  '#875053',
  '#129490',
  '#E5A823',
  '#0055A2',
  '#96C5F7',
]

const makeNode = (commit) => {
  const node = new Node(commit.sha)
  node.y = START_Y
  node.x = START_X
  node.commit = commit
  node.color = Color.parseHex(Colours[0])
  node.secondColor = null
  return node
}

export class SubwayCalculator {
  colors = Colours
  currentMap = null

  constructor(rowHeight) {
    this.rowHeight = rowHeight
  }

  getSubwayMap(commits) {
    const nodes = commits.map(makeNode)
    const nodeDict = nodes.reduce((agg, node) => {
      agg[node.commit.sha] = node
      return agg
    }, {})
    const links = this.generateLinks(nodes, nodeDict)
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
    while (i < commits.length || j < nodes.length) {
      if (j >= nodes.length || nodes[j].commit.sha !== commits[i].sha) {
        const node = makeNode(commits[i])
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

    this.currentMap.links = this.generateLinks(nodes, nodeDict)
    this.updateMapLayout(this.currentMap)
    return this.currentMap
  }

  generateLinks = (nodes, nodeDict) => {
    const links = []
    const _infinityY = this.rowHeight * (nodes.length + 1)
    nodes.forEach((node) => {
      const commit = node.commit
      if (commit.parents.length === 0) {
        const infinityNode = new Node('infty-' + commit.sha)
        infinityNode.x = nodeDict[commit.sha].x
        infinityNode.y = _infinityY

        const newLink = new Link(nodeDict[commit.sha], infinityNode)
        newLink.color = nodeDict[commit.sha].color

        links.push(newLink)
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

    return links
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
        node.color.setHex(Colours[i % Colours.length])
      }, this)
    }, this)

    // construct slices for per-commit rendering
    const rows = new Array(map.nodes.length)
    for (let i = 0; i < map.nodes.length; i++) {
      const node = map.nodes[i]
      const links = []
      branchLines.forEach((branchLine) => {
        const belongsToBranch = branchLine.indexInThisBranch(i)
        const [pointAbove, pointBelow] = branchLine.pointsAroundIndex(i)
        if (belongsToBranch) {
          links.push(new Link(pointAbove, node), new Link(node, pointBelow))
        } else {
          links.push(new Link(pointAbove, pointBelow))
        }
      })

      rows[i] = [{ yOffset: this.rowHeight * i, node, links }]
    }
  }
}
