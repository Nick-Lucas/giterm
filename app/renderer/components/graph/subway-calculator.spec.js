import { expect } from 'chai'

import {
  SubwayCalculator,
  START_X,
  START_Y,
  X_SEPARATION,
  Colours,
} from './subway-calculator'
import { Node } from './models/node'
import { Link } from './models/link'
import { SubwayMap } from './models/subway-map'
import { Color } from './models/color'

const newCommit = (sha, parents) => ({
  sha,
  parents,
})

const getNodes = (commits, ...columns) => {
  const nodes = commits.map((c, i) => {
    const n = new Node(c.sha)
    n.commit = c
    n.y = START_Y + i
    n.x = START_X
    return n
  })

  columns.forEach(({ colour, indexes }, columnIndex) => {
    indexes.forEach((i) => {
      nodes[i].x = START_X + X_SEPARATION * columnIndex
      nodes[i].color = Color.parseHex(colour)
    })
  })

  return nodes
}

const getLinks = (nodes, ...pairs) =>
  pairs.map(({ pair: [l, r], colour }) => {
    const link = new Link(nodes[l], nodes[r])
    link.color = Color.parseHex(colour)
    return link
  })

const getNodeDict = (nodes) =>
  nodes.reduce((agg, n) => {
    agg[n.id] = n
    return agg
  }, {})

const equal = (target, expected) => {
  try {
    expect(JSON.stringify(target)).to.deep.eql(JSON.stringify(expected))
  } catch (_) {
    expect(target).to.deep.eql(expected)
  }
}

context('branchlines calculator', () => {
  let data = () => []

  let calculator
  const calculate = () => {
    calculator = new SubwayCalculator(1)

    const commits = data()
    return calculator.getSubwayMap(commits)
  }

  context('getSubwayMap', () => {
    it.only('should construct a simple branch', () => {
      data = () => [
        newCommit('a', ['b']),
        newCommit('b', ['c']),
        newCommit('c', []),
      ]

      const subwayMap = calculate()

      const nodes = getNodes(data(), {
        colour: Colours[0],
        indexes: [0, 1, 2],
      })
      const links = getLinks(
        nodes,
        { pair: [0, 1], colour: Colours[0] },
        { pair: [1, 2], colour: Colours[0] },
      )
      const dict = getNodeDict(nodes)
      const expectedMap = new SubwayMap(nodes, links, dict)

      equal(subwayMap, expectedMap)
    })

    it('should construct a pair of branches', () => {
      data = () => [
        newCommit('a', ['b']),
        newCommit('b', ['d']),
        newCommit('c', ['d']),
        newCommit('d', []),
      ]

      const subwayMap = calculate()

      const nodes = getNodes(
        data(),
        {
          colour: Colours[0],
          indexes: [0, 1, 3],
        },
        {
          colour: Colours[1],
          indexes: [2],
        },
      )
      const links = getLinks(
        nodes,
        { pair: [0, 1], colour: Colours[0] },
        { pair: [1, 3], colour: Colours[0] },
        { pair: [2, 3], colour: Colours[1] },
      )
      const dict = getNodeDict(nodes)
      const expectedMap = new SubwayMap(nodes, links, dict)

      equal(subwayMap, expectedMap)
    })
  })
})
