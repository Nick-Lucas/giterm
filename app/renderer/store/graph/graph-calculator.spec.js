import { expect } from 'chai'

import {
  GraphCalculator,
  START_X,
  START_Y,
  X_SEPARATION,
  Colours,
} from './graph-calculator'
import { Node } from './models/node'
import { Link } from './models/link'
import { GraphMap } from './models/graph-map'

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

  columns.forEach(({ colour, indexes, colIndex }) => {
    indexes.forEach((i) => {
      nodes[i].x = START_X + X_SEPARATION * colIndex
      nodes[i].color = colour
    })
  })

  return nodes
}

const getLinks = (nodes, ...pairs) =>
  pairs.map(({ pair: [l, r], merge = false, colour }) => {
    const link = new Link(nodes[l], nodes[r])
    link.color = colour
    link.merge = merge
    return link
  })

const getNodeDict = (nodes) =>
  nodes.reduce((agg, n) => {
    agg[n.id] = n
    return agg
  }, {})

const indexes = (array, ...indexes) => indexes.map((i) => array[i])

const equal = (target, expected) => {
  try {
    expect(JSON.stringify(target)).to.deep.eql(JSON.stringify(expected))
  } catch (_) {
    expect(target).to.deep.eql(expected)
  }
}

context('git graph calculator', () => {
  let data = () => []
  let nodes
  let links

  let calculator
  const calculate = () => {
    calculator = new GraphCalculator(1)

    const commits = data()
    calculator.retrieve(commits)
    return calculator
  }

  context('retrieve', () => {
    context('simple branch', () => {
      beforeEach(() => {
        data = () => [
          newCommit('a', ['b']),
          newCommit('b', ['c']),
          newCommit('c', []),
        ]
        calculate()

        nodes = getNodes(data(), {
          colour: Colours[0],
          indexes: [0, 1, 2],
          colIndex: 0,
        })
        links = getLinks(
          nodes,
          { pair: [0, 1], colour: Colours[0] },
          { pair: [1, 2], colour: Colours[0] },
        )
      })

      it('should construct map correctly', () => {
        const graphMap = calculator.map
        const dict = getNodeDict(nodes)
        const expectedMap = new GraphMap(nodes, links, dict)

        equal(graphMap, expectedMap)
      })

      it('should construct rows correctly', () => {
        const rows = calculator.rows

        const expectedRows = [
          { yOffset: 0, node: nodes[0], links: [links[0]] },
          { yOffset: 1, node: nodes[1], links: [links[0], links[1]] },
          { yOffset: 2, node: nodes[2], links: [links[1]] },
        ]

        equal(rows, expectedRows)
      })
    })

    context('pair of branches', () => {
      beforeEach(() => {
        data = () => [
          newCommit('a', ['b']),
          newCommit('b', ['d']),
          /**/ newCommit('c', ['d']),
          newCommit('d', []),
        ]
        calculate()

        nodes = getNodes(
          data(),
          {
            colour: Colours[0],
            indexes: [0, 1, 3],
            colIndex: 0,
          },
          {
            colour: Colours[1],
            indexes: [2],
            colIndex: 1,
          },
        )
        links = getLinks(
          nodes,
          { pair: [0, 1], colour: Colours[0] },
          { pair: [1, 3], colour: Colours[0] },
          { pair: [2, 3], colour: Colours[1] },
        )
      })

      it('should construct map correctly', () => {
        const graphMap = calculator.map
        const dict = getNodeDict(nodes)
        const expectedMap = new GraphMap(nodes, links, dict)

        equal(graphMap, expectedMap)
      })

      it('should construct rows correctly', () => {
        const rows = calculator.rows

        const expectedRows = [
          { yOffset: 0, node: nodes[0], links: [links[0]] },
          { yOffset: 1, node: nodes[1], links: [links[0], links[1]] },
          { yOffset: 2, node: nodes[2], links: [links[1], links[2]] },
          { yOffset: 3, node: nodes[3], links: [links[1], links[2]] },
        ]

        equal(rows, expectedRows)
      })
    })

    context('edge case with two branches coming off same root commit', () => {
      beforeEach(() => {
        data = () => [
          newCommit('a', ['b']),
          newCommit('b', ['e']),

          // Branch 1
          /**/ newCommit('c', ['e']),

          // Branch 2
          /**/ /**/ newCommit('d', ['e']),

          newCommit('e', []),
        ]
        calculate()

        nodes = getNodes(
          data(),
          {
            colour: Colours[0],
            indexes: [0, 1, 4],
            colIndex: 0,
          },
          {
            colour: Colours[1],
            indexes: [2],
            colIndex: 1,
          },
          {
            colour: Colours[2],
            indexes: [3],
            colIndex: 2,
          },
        )
        links = getLinks(
          nodes,
          { pair: [0, 1], colour: Colours[0] },
          { pair: [1, 4], colour: Colours[0] },
          { pair: [2, 4], colour: Colours[1] },
          { pair: [3, 4], colour: Colours[2] },
        )
      })

      it('should construct map correctly', () => {
        const graphMap = calculator.map
        const dict = getNodeDict(nodes)
        const expectedMap = new GraphMap(nodes, links, dict)

        equal(graphMap, expectedMap)
      })

      it('should construct rows correctly', () => {
        const rows = calculator.rows

        const expectedRows = [
          { yOffset: 0, node: nodes[0], links: [links[0]] },
          { yOffset: 1, node: nodes[1], links: [links[0], links[1]] },
          { yOffset: 2, node: nodes[2], links: [links[1], links[2]] },
          {
            yOffset: 3,
            node: nodes[3],
            links: [links[1], links[2], links[3]],
          },
          {
            yOffset: 4,
            node: nodes[4],
            links: [links[1], links[2], links[3]],
          },
        ]

        equal(rows, expectedRows)
      })
    })

    context(
      'edge case with three branches and a merge (https://github.com/Nick-Lucas/giterm/issues/23)',
      () => {
        beforeEach(() => {
          data = () => [
            newCommit('a', ['e', 'c']),
            /**/ /**/ newCommit('b', ['d']),
            /**/ newCommit('c', ['e']),
            /**/ /**/ newCommit('d', ['e']),
            newCommit('e', []),
          ]
          calculate()

          nodes = getNodes(
            data(),
            {
              colour: Colours[0],
              indexes: [0, 4],
              colIndex: 0,
            },
            {
              colour: Colours[1],
              indexes: [2],
              colIndex: 1,
            },
            {
              colour: Colours[2],
              indexes: [1, 3],
              colIndex: 2,
            },
          )
          nodes[0].secondColor = Colours[1]
          links = getLinks(
            nodes,
            { pair: [0, 4], colour: Colours[0], merge: true },
            { pair: [0, 2], colour: Colours[1], merge: true },
            { pair: [1, 3], colour: Colours[2] },
            { pair: [2, 4], colour: Colours[1] },
            { pair: [3, 4], colour: Colours[2] },
          )
        })

        it('should construct map correctly', () => {
          const graphMap = calculator.map
          const dict = getNodeDict(nodes)
          const expectedMap = new GraphMap(nodes, links, dict)

          equal(graphMap, expectedMap)
        })

        it('should construct rows correctly', () => {
          const rows = calculator.rows

          const expectedRows = [
            { yOffset: 0, node: nodes[0], links: [links[0], links[1]] },
            {
              yOffset: 1,
              node: nodes[1],
              links: [links[0], links[1], links[2]],
            },
            {
              yOffset: 2,
              node: nodes[2],
              links: [links[0], links[1], links[2], links[3]],
            },
            {
              yOffset: 3,
              node: nodes[3],
              links: [links[0], links[2], links[3], links[4]],
            },
            {
              yOffset: 4,
              node: nodes[4],
              links: [links[0], links[3], links[4]],
            },
          ]

          equal(rows, expectedRows)
        })
      },
    )

    context(
      'edge case with overlapping branches v1 (https://github.com/Nick-Lucas/giterm/issues/36)',
      () => {
        beforeEach(() => {
          data = () => [
            newCommit('a1', ['a2']),
            /**/ /**/ newCommit('c2', ['a3']),
            newCommit('a2', ['a3', 'b1']),
            newCommit('a3', ['a4']),
            /**/ newCommit('b1', ['a4']),
            newCommit('a4', []),
          ]
          calculate()

          nodes = getNodes(
            data(),
            {
              colour: Colours[0],
              indexes: [0, 2, 3, 5],
              colIndex: 0,
            },
            {
              colour: Colours[1],
              indexes: [1],
              colIndex: 1,
            },
            {
              colour: Colours[2],
              indexes: [4],
              colIndex: 2,
            },
          )
          nodes[2].secondColor = Colours[2]
          links = getLinks(
            nodes,
            { pair: [0, 2], colour: Colours[0] },
            { pair: [1, 3], colour: Colours[1] },
            { pair: [2, 3], colour: Colours[0], merge: true },
            { pair: [2, 4], colour: Colours[2], merge: true },
            { pair: [3, 5], colour: Colours[0] },
            { pair: [4, 5], colour: Colours[2] },
          )
        })

        it('should construct map correctly', () => {
          const graphMap = calculator.map
          const dict = getNodeDict(nodes)
          const expectedMap = new GraphMap(nodes, links, dict)

          equal(graphMap, expectedMap)
        })

        it('should construct rows correctly', () => {
          const rows = calculator.rows

          const expectedRows = [
            { yOffset: 0, node: nodes[0], links: indexes(links, 0) },
            { yOffset: 1, node: nodes[1], links: indexes(links, 0, 1) },
            { yOffset: 2, node: nodes[2], links: indexes(links, 0, 1, 2, 3) },
            { yOffset: 3, node: nodes[3], links: indexes(links, 1, 2, 3, 4) },
            { yOffset: 4, node: nodes[4], links: indexes(links, 3, 4, 5) },
            { yOffset: 5, node: nodes[5], links: indexes(links, 4, 5) },
          ]

          equal(rows, expectedRows)
        })
      },
    )

    context(
      'edge case with overlapping branches v2 (https://github.com/Nick-Lucas/giterm/issues/36)',
      () => {
        beforeEach(() => {
          data = () => [
            newCommit('a1', ['a2']),
            /**/ /**/ newCommit('c1', ['a4']),
            newCommit('a2', ['a3', 'b1']),
            /**/ newCommit('b1', ['a3']),
            newCommit('a3', ['a4']),
            newCommit('a4', []),
          ]
          calculate()

          nodes = getNodes(
            data(),
            {
              colour: Colours[0],
              indexes: [0, 2, 4, 5],
              colIndex: 0,
            },
            {
              colour: Colours[1],
              indexes: [1],
              colIndex: 1,
            },
            {
              colour: Colours[2],
              indexes: [3],
              colIndex: 2,
            },
          )
          nodes[2].secondColor = Colours[2]
          links = getLinks(
            nodes,
            { pair: [0, 2], colour: Colours[0] },
            { pair: [1, 5], colour: Colours[1] },
            { pair: [2, 4], colour: Colours[0], merge: true },
            { pair: [2, 3], colour: Colours[2], merge: true },
            { pair: [3, 4], colour: Colours[2] },
            { pair: [4, 5], colour: Colours[0] },
          )
        })

        it('should construct map correctly', () => {
          const graphMap = calculator.map
          const dict = getNodeDict(nodes)
          const expectedMap = new GraphMap(nodes, links, dict)

          equal(graphMap, expectedMap)
        })

        it('should construct rows correctly', () => {
          const rows = calculator.rows

          const expectedRows = [
            { yOffset: 0, node: nodes[0], links: indexes(links, 0) },
            { yOffset: 1, node: nodes[1], links: indexes(links, 0, 1) },
            { yOffset: 2, node: nodes[2], links: indexes(links, 0, 1, 2, 3) },
            { yOffset: 3, node: nodes[3], links: indexes(links, 1, 2, 3, 4) },
            { yOffset: 4, node: nodes[4], links: indexes(links, 1, 2, 4, 5) },
            { yOffset: 5, node: nodes[5], links: indexes(links, 1, 5) },
          ]

          equal(rows, expectedRows)
        })
      },
    )

    context(
      'edge case with touching branches (https://github.com/Nick-Lucas/giterm/issues/42)',
      () => {
        beforeEach(() => {
          data = () => [
            newCommit('a1', ['a2', 'c1']),
            /**/ newCommit('c1', ['a2']),
            newCommit('a2', ['a3', 'b1']),
            /**/ newCommit('b1', ['a3']),
            newCommit('a3', []),
          ]
          calculate()

          nodes = getNodes(
            data(),
            {
              colour: Colours[0],
              indexes: [0, 2, 4],
              colIndex: 0,
            },
            {
              colour: Colours[1],
              indexes: [1],
              colIndex: 1,
            },
            {
              colour: Colours[2],
              indexes: [3],
              colIndex: 1,
            },
          )
          nodes[0].secondColor = Colours[1]
          nodes[2].secondColor = Colours[2]
          links = getLinks(
            nodes,
            { pair: [0, 2], colour: Colours[0], merge: true },
            { pair: [0, 1], colour: Colours[1], merge: true },
            { pair: [1, 2], colour: Colours[1] },
            { pair: [2, 4], colour: Colours[0], merge: true },
            { pair: [2, 3], colour: Colours[2], merge: true },
            { pair: [3, 4], colour: Colours[2] },
          )
        })

        it('should construct map correctly', () => {
          const graphMap = calculator.map
          const dict = getNodeDict(nodes)
          const expectedMap = new GraphMap(nodes, links, dict)

          equal(graphMap, expectedMap)
        })

        it('should construct rows correctly', () => {
          const rows = calculator.rows

          const expectedRows = [
            { yOffset: 0, node: nodes[0], links: indexes(links, 0, 1) },
            { yOffset: 1, node: nodes[1], links: indexes(links, 0, 1, 2) },
            { yOffset: 2, node: nodes[2], links: indexes(links, 0, 2, 3, 4) },
            { yOffset: 3, node: nodes[3], links: indexes(links, 3, 4, 5) },
            { yOffset: 4, node: nodes[4], links: indexes(links, 3, 5) },
          ]

          equal(rows, expectedRows)
        })
      },
    )
  })
})
