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
    calculator.retrieve(commits)
    return calculator
  }

  context('retrieve', () => {
    context('should construct a simple branch', () => {
      beforeEach(() => {
        data = () => [
          newCommit('a', ['b']),
          newCommit('b', ['c']),
          newCommit('c', []),
        ]

        calculate()
      })

      it('should construct map correctly', () => {
        const subwayMap = calculator.map

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

      it('should construct rows correctly', () => {
        const rows = calculator.rows

        const nodes = getNodes(data(), {
          colour: Colours[0],
          indexes: [0, 1, 2],
        })
        const links = getLinks(
          nodes,
          { pair: [0, 1], colour: Colours[0] },
          { pair: [1, 2], colour: Colours[0] },
        )

        const expectedRows = [
          { yOffset: 0, node: nodes[0], links: [links[0]] },
          { yOffset: 1, node: nodes[1], links: [links[0], links[1]] },
          { yOffset: 2, node: nodes[2], links: [links[1]] },
        ]

        equal(rows, expectedRows)
      })
    })

    context('should construct a pair of branches', () => {
      beforeEach(() => {
        data = () => [
          newCommit('a', ['b']),
          newCommit('b', ['d']),
          newCommit('c', ['d']),
          newCommit('d', []),
        ]

        calculate()
      })

      it('should construct map correctly', () => {
        const subwayMap = calculator.map

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

      it('should construct rows correctly', () => {
        const rows = calculator.rows

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

        const expectedRows = [
          { yOffset: 0, node: nodes[0], links: [links[0]] },
          { yOffset: 1, node: nodes[1], links: [links[0], links[1]] },
          { yOffset: 2, node: nodes[2], links: [links[1], links[2]] },
          { yOffset: 3, node: nodes[3], links: [links[1], links[2]] },
        ]

        equal(rows, expectedRows)
      })
    })
  })
})
