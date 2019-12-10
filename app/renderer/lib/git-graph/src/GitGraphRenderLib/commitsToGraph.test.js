import { TestGitBuilder } from "./TestGitBuilder"
import { commitsToGraph, _link } from "./commitsToGraph"

// Very useful site for finding appropriate characters: http://shapecatcher.com/

describe('commitsToGraph', () => {
  let git = new TestGitBuilder()
  beforeEach(() => {
    git = new TestGitBuilder()
  })

  function makeColours(primaryColour, secondaryColour=null) {
    return {
      primaryColour,
      secondaryColour
    }
  }
  
  function makeLinks(currentRow, ...pairs) {
    return pairs.map(
      ([from,to,colour]) => _link(
        currentRow-1,
        from,
        currentRow,
        to,
        colour
      )
    )
  }

  describe('Standard Scenarios', () => {
    it(`should work on a simple commit chain
        --------------------------------------------
          .
          | 
          |
        --------------------------------------------
    `, () => {
      git.addCommit()
      git.addCommit()

      const { nodes, links } = commitsToGraph(git.getCommits())

      expectToEqualShape(nodes, [
        ['.'],
        ['.'],
        ['.'],
      ])
      expectNodeColours(nodes, [
        makeColours(0), 
        makeColours(0), 
        makeColours(0)
      ])
      expectLinks(links, [
        [],
        makeLinks(1, [0, 0, 0]),
        makeLinks(2, [0, 0, 0]),
      ])
    })

    it(`should work on an open branch
        --------------------------------------------
          . 
          | .
          |/
        --------------------------------------------
    `, () => {
      git.addCommit({ id: 'branch_a', parentId: 'root' })
      git.addCommit({ id: 'branch_b', parentId: 'root' })

      const { nodes, links } = commitsToGraph(git.getCommits())

      expectToEqualShape(nodes, [
        ['.'],
        [' ', '.'],
        ['.', ' '],
      ])
      expectNodeColours(nodes, [
        makeColours(0), 
        makeColours(1), 
        makeColours(0)
      ])
      expectLinks(links, [
        [],
        makeLinks(1, [0, 0, 0]),
        makeLinks(2, [0, 0, 0], [1, 0, 1]),
      ])
    })

    it(`should work on a merged branch
        --------------------------------------------
          . 
          |৲
          |/
        --------------------------------------------
    `, () => {
      git.addCommit({ id: 'branch_a', parentId: 'root' })
      git.addMerge({ parentId1: 'root', parentId2: 'branch_a' })

      const { nodes, links } = commitsToGraph(git.getCommits())

      expectToEqualShape(nodes, [
        ['.'],
        [' ', '.'],
        ['.', ' '],
      ])
      expectNodeColours(nodes, [
        makeColours(0, 1),
        makeColours(1),
        makeColours(0)
      ])
      expectLinks(links, [
        [],
        makeLinks(1, [0, 0, 0], [0, 1, 1]),
        makeLinks(2, [0, 0, 0], [1, 0, 1]),
      ])
    })

    it(`should work on a second root
        --------------------------------------------
          . 
          |.
          |
        --------------------------------------------
    `, () => {
      git.addCommit({id: "branch_b", orphan: true})
      git.addCommit({id: 'branch_a', parentId: 'root'})

      const { nodes, links } = commitsToGraph(git.getCommits())

      expectToEqualShape(nodes, [
        ['.'],
        [' ', '.'],
        ['.'],
      ])
      expectNodeColours(nodes, [
        makeColours(0), 
        makeColours(1), 
        makeColours(0)
      ])
      expectLinks(links, [
        [],
        makeLinks(1, [0, 0, 0]),
        makeLinks(2, [0, 0, 0]),
      ])
    })  
  })

  describe('Repeated merging with active branch', () => {
    it(`Merge from master to branch
        --------------------------------------------
          .
          |.
          .⩘
          |.
          ./
        --------------------------------------------
    `, () => {
      git.addCommit({ id: 'branch_b_1', parentId: 'root' })
      git.addCommit({ id: 'root_2', parentId: 'root' })
      git.addMerge({ parentId1: 'branch_b_1', parentId2: 'root_2' })
      git.addCommit({ id: 'root_3', parentId: 'root_2' })

      const { nodes, links } = commitsToGraph(git.getCommits())

      expectToEqualShape(nodes, [
        ['.'],
        [' ', '.'],
        ['.', ' '],
        [' ', '.'],
        ['.', ' '],
      ])
      expectNodeColours(nodes, [
        makeColours(0), 
        makeColours(1, 0), 
        makeColours(0),
        makeColours(1),
        makeColours(0),
      ])
      expectLinks(links, [
        [],
        makeLinks(1, [0, 0, 0]),
        makeLinks(2, [0, 0, 0], [1, 1, 1], [1, 0, 0]),
        makeLinks(3, [0, 0, 0], [1, 1, 1]),
        makeLinks(4, [0, 0, 0], [1, 0, 1]),
      ])
    })

    it(`Merge into master from branch
        --------------------------------------------
          .৲
          |.
          .|
          |ч 
          ./
        --------------------------------------------
    `, () => {
      git.addCommit({ id: 'branch_b_1', parentId: 'root' })
      git.addMerge({ id: 'root_2', parentId1: 'root', parentId2: 'branch_b_1' })
      git.addCommit({ id: 'branch_b_2', parentId: 'branch_b_1' })
      git.addMerge({ parentId1: 'root_2', parentId2: 'branch_b_2' })

      const { nodes, links } = commitsToGraph(git.getCommits())

      expectToEqualShape(nodes, [
        ['.'],
        [' ', '.'],
        ['.', ' '],
        [' ', '.'],
        ['.', ' '],
      ])
      expectNodeColours(nodes, [
        makeColours(0, 1), 
        makeColours(1), 
        makeColours(0, 1),
        makeColours(1),
        makeColours(0),
      ])
      expectLinks(links, [
        [],
        makeLinks(1, [0, 0, 0], [0, 1, 1]),
        makeLinks(2, [0, 0, 0], [1, 1, 1]),
        makeLinks(3, [0, 0, 0], [1, 1, 1], [0, 1, 1]),
        makeLinks(4, [0, 0, 0], [1, 0, 1]),
      ])
    })
  })

  describe('Multi-branch', () => {
    it(`should work on two branches merged in proximity
        --------------------------------------------
          .৲ 
          .|৲
          |.|
          ||.
          .//
        --------------------------------------------
    `, () => {
      git.addCommit({ id: 'a1', parentId: 'root' })
      git.addCommit({ id: 'b1', parentId: 'root' })
      git.addMerge({ id: 'm1', parentId1: 'root', parentId2: 'a1' })
      git.addMerge({ id: 'm2', parentId1: 'm1', parentId2: 'b1' })

      const { nodes, links } = commitsToGraph(git.getCommits())

      expectToEqualShape(nodes, [
        ['.'],
        ['.'],
        [' ', '.'],
        [' ', ' ', '.'],
        ['.', ' ', ' '],
      ])
      expectNodeColours(nodes, [
        makeColours(0, 1), 
        makeColours(0, 2), 
        makeColours(1),
        makeColours(2),
        makeColours(0),
      ])
      expectLinks(links, [
        [],
        makeLinks(1, [0, 0, 0], [0, 1, 1]),
        makeLinks(2, [0, 0, 0], [1, 1, 1], [0, 2, 2]),
        makeLinks(3, [0, 0, 0], [1, 1, 1], [2, 2, 2]),
        makeLinks(4, [0, 0, 0], [1, 0, 1], [2, 0, 2]),
      ])
    })

    it(`should adjust node columns when an inner column is removed
        --------------------------------------------
          .৲ 
          .|৲
          |.|
          ||.
          ./˩৲
          ||.
          |.|
          .//
        --------------------------------------------
    `, () => {
      git.addCommit({ id: 'a1', parentId: 'root' })
      git.addCommit({ id: 'b1', parentId: 'root' })
      git.addMerge({ id: 'm1', parentId1: 'root', parentId2: 'b1' })
      git.addCommit({ id: 'a2', parentId: 'a1' })
      git.addCommit({ id: 'c1', parentId: 'm1' })
      git.addMerge({ id: 'm2', parentId1: 'm1', parentId2: 'a2' })
      git.addMerge({ id: 'm3', parentId1: 'm2', parentId2: 'c1' })

      const { nodes, links } = commitsToGraph(git.getCommits())

      expectToEqualShape(nodes, [
        ['.'],
        ['.'],
        [' ', '.'],
        [' ', ' ', '.'],
        ['.', ' ', ' '],
        [' ', ' ', '.'],
        [' ', '.', ' '],
        ['.', ' ', ' '],
      ])
      expectNodeColours(nodes, [
        makeColours(0, 1), 
        makeColours(0, 2), 
        makeColours(1),
        makeColours(2),
        makeColours(0, 3),
        makeColours(3),
        makeColours(2),
        makeColours(0),
      ])
      expectLinks(links, [
        [],
        makeLinks(1, [0, 0, 0], [0, 1, 1]),
        makeLinks(2, [0, 0, 0], [1, 1, 1], [0, 2, 2]),
        makeLinks(3, [0, 0, 0], [1, 1, 1], [2, 2, 2]),
        makeLinks(4, [0, 0, 0], [1, 0, 1], [2, 2, 2]),
        makeLinks(5, [0, 0, 0], [2, 1, 2], [0, 2, 3]),
        makeLinks(6, [0, 0, 0], [1, 1, 2], [2, 2, 3]),
        makeLinks(7, [0, 0, 0], [1, 0, 2], [2, 0, 3]),
      ])
    })
  })

  describe('Data driven scenarios', () => {
    it(`should merge in at correct point
        --------------------------------------------
          .৲
          |.
          .|
          |ч.
          |.|
          .//
        --------------------------------------------
    `, () => {
      const commits = [
        {
          sha: 'root2',
          parents: [
            'root1',
            'a2'
          ]
        },
        {
          sha: 'a2',
          parents: [
            'a1'
          ]
        },
        {
          sha: 'root1',
          parents: [
            'root',
            'a1'
          ]
        },
        {
          sha: 'b1',
          parents: [
            'root'
          ]
        },
        {
          sha: 'a1',
          parents: [
            'root'
          ]
        },
        {
          sha: 'root',
          parents: []
        }
      ]

      const { nodes, links } = commitsToGraph(commits)

      expectToEqualShape(nodes, [
        ['.'],
        [' ', '.'],
        ['.', ' '],
        [' ', ' ', '.'],
        [' ', '.', ' '],
        ['.', ' ', ' '],
      ])
      expectNodeColours(nodes, [
        makeColours(0, 1), 
        makeColours(1), 
        makeColours(0, 1),
        makeColours(2),
        makeColours(1),
        makeColours(0),
      ])
      expectLinks(links, [
        [],
        makeLinks(1, [0, 0, 0], [0, 1, 1]),
        makeLinks(2, [0, 0, 0], [1, 1, 1]),
        makeLinks(3, [0, 0, 0], [1, 1, 1], [0, 1, 1]),
        makeLinks(4, [0, 0, 0], [1, 1, 1], [2, 2, 2]),
        makeLinks(5, [0, 0, 0], [1, 0, 1], [2, 0, 2]),
      ])
    })

    it(`should draw a graph where consecutive nodes are merged
          (was observed to cause a condition where 'root' was in second column)
        --------------------------------------------
          .৲
          |.
          .|
          ./
        --------------------------------------------
    `, () => {
      const commits = [
        {
          sha: 'a2',
          sha7: 'a2',
          parents: [
            'a1',
            'root1'
          ]
        },
        {
          sha: 'root1',
          sha7: 'root1',
          parents: [
            'root'
          ]
        },
        {
          sha: 'a1',
          sha7: 'a1',
          parents: [
            'root'
          ]
        },
        {
          sha: 'root',
          sha7: 'root',
          parents: []
        }
      ]

      const { nodes, links } = commitsToGraph(commits)

      expectToEqualShape(nodes, [
        ['.'],
        [' ', '.'],
        ['.', ' '],
        ['.', ' '],
      ])
      expectNodeColours(nodes, [
        makeColours(0, 1), 
        makeColours(1), 
        makeColours(0),
        makeColours(0)
      ])
      expectLinks(links, [
        [],
        makeLinks(1, [0, 0, 0], [0, 1, 1]),
        makeLinks(2, [0, 0, 0], [1, 1, 1]),
        makeLinks(3, [0, 0, 0], [1, 0, 1]),
      ])
    })
  })

  describe('Rehydration', () => {
    it(`should rehydrate and continue where it left off on test case:
          'should work on two branches merged in proximity'
        --------------------------------------------
          .৲ 
          .|৲
          |.|
          ||.
          .//
        --------------------------------------------
    `, () => {
      git.addCommit({ id: 'a1', parentId: 'root' })
      git.addCommit({ id: 'b1', parentId: 'root' })
      git.addMerge({ id: 'm1', parentId1: 'root', parentId2: 'a1' })
      git.addMerge({ id: 'm2', parentId1: 'm1', parentId2: 'b1' })

      const commits1 = git.getCommits().slice(0, 2)
      const commits2 = git.getCommits().slice(2)
      expect(commits1.length + commits2.length).toBe(git.getCommits().length)

      const { rehydrationPackage } = commitsToGraph(commits1)
      const { nodes, links } = commitsToGraph(commits2, rehydrationPackage)

      expectToEqualShape(nodes, [
        ['.'],
        ['.'],
        [' ', '.'],
        [' ', ' ', '.'],
        ['.', ' ', ' '],
      ])
      expectNodeColours(nodes, [
        makeColours(0, 1), 
        makeColours(0, 2), 
        makeColours(1),
        makeColours(2),
        makeColours(0),
      ])
      expectLinks(links, [
        [],
        makeLinks(1, [0, 0, 0], [0, 1, 1]),
        makeLinks(2, [0, 0, 0], [1, 1, 1], [0, 2, 2]),
        makeLinks(3, [0, 0, 0], [1, 1, 1], [2, 2, 2]),
        makeLinks(4, [0, 0, 0], [1, 0, 1], [2, 0, 2]),
      ])
    })

    it(`should rehydrate and continue where it left off on test case:
          'should adjust node columns when an inner column is removed'
        --------------------------------------------
          .৲ 
          .|৲
          |.|
          ||.
          ./˩৲
          ||.
          |.|
          .//
        --------------------------------------------
    `, () => {
      git.addCommit({ id: 'a1', parentId: 'root' })
      git.addCommit({ id: 'b1', parentId: 'root' })
      git.addMerge({ id: 'm1', parentId1: 'root', parentId2: 'b1' })
      git.addCommit({ id: 'a2', parentId: 'a1' })
      git.addCommit({ id: 'c1', parentId: 'm1' })
      git.addMerge({ id: 'm2', parentId1: 'm1', parentId2: 'a2' })
      git.addMerge({ id: 'm3', parentId1: 'm2', parentId2: 'c1' })

      const commits1 = git.getCommits().slice(0, 4)
      const commits2 = git.getCommits().slice(4)
      expect(commits1.length + commits2.length).toBe(git.getCommits().length)

      const { rehydrationPackage } = commitsToGraph(commits1)
      const { nodes, links } = commitsToGraph(commits2, rehydrationPackage)

      expectToEqualShape(nodes, [
        ['.'],
        ['.'],
        [' ', '.'],
        [' ', ' ', '.'],
        ['.', ' ', ' '],
        [' ', ' ', '.'],
        [' ', '.', ' '],
        ['.', ' ', ' '],
      ])
      expectNodeColours(nodes, [
        makeColours(0, 1), 
        makeColours(0, 2), 
        makeColours(1),
        makeColours(2),
        makeColours(0, 3),
        makeColours(3),
        makeColours(2),
        makeColours(0),
      ])
      expectLinks(links, [
        [],
        makeLinks(1, [0, 0, 0], [0, 1, 1]),
        makeLinks(2, [0, 0, 0], [1, 1, 1], [0, 2, 2]),
        makeLinks(3, [0, 0, 0], [1, 1, 1], [2, 2, 2]),
        makeLinks(4, [0, 0, 0], [1, 0, 1], [2, 2, 2]),
        makeLinks(5, [0, 0, 0], [2, 1, 2], [0, 2, 3]),
        makeLinks(6, [0, 0, 0], [1, 1, 2], [2, 2, 3]),
        makeLinks(7, [0, 0, 0], [1, 0, 2], [2, 0, 3]),
      ])
    })
  })
})

function format(obj) {
  return JSON.stringify(obj, null, 2)
}

/**
 * Checks that the layout of nodes/links in their columns are correct
 * The shape is an array of rows, where each column is either: 0 -> node, 1 -> link
 */
function expectToEqualShape(nodes, expectedShape) {
  function toName(char) {
    switch(char) {
      case '.':
        return 'node'
      default:
        return 'blank'
    }
  }
  try {
    expect(nodes.length).toBe(expectedShape.length)
  } catch (e) {
    let error = "Shape not equal. Different length: \n\n"
    error += 'Graph: ' + JSON.stringify(nodes.map(row => row.map(node => node.type))) + '\n'
    error += 'Expected shape: ' + JSON.stringify(expectedShape.map(row => row.map(toName))) + '\n\n'
    throw new Error(error)
  }

  for (let i = 0; i < nodes.length; i++) {
    const row = nodes[i]
    const rowShape = expectedShape[i]

    try {
      expect(row.length).toBe(rowShape.length)
    } catch (e) {
      let error = "Shape not equal. Row " + i + " had different number of columns: \n\n"
      error += 'Graph Row: ' + JSON.stringify(row.map(node => node.type)) + '\n'
      error += 'Expected shape: ' + JSON.stringify(rowShape.map(toName)) + '\n\n'
      error += 'Graph: ' + JSON.stringify(nodes.map(row => row.map(node => node.type)), null, 2) + '\n'
      error += 'Expected shape: ' + JSON.stringify(expectedShape.map(row => row.map(toName)), null, 2) + '\n\n'
      throw new Error(error)
    }

    try {
      for (let i = 0; i < row.length; i++) {
        expect(row[i].type).toBe(toName(rowShape[i]))
      }
    } catch (e) {
      let error = "Shape not equal. Row " + i + " had different types of columns: \n\n"
      error += 'Graph Row: ' + JSON.stringify(row.map(node => node.type)) + '\n'
      error += 'Expected shape: ' + JSON.stringify(rowShape.map(toName)) + '\n\n'
      error += 'Graph: ' + JSON.stringify(nodes.map(row => row.map(node => node.type)), null, 2) + '\n'
      error += 'Expected shape: ' + JSON.stringify(expectedShape.map(row => row.map(toName)), null, 2) + '\n\n'
      throw new Error(error)
    }
  }
}

function expectNodeColours(nodes, expectedColours) {
  const nodeColours = nodes
    .map(row => row.find(node => node.type === 'node'))
    .map(node => 
      ({ 
        primaryColour: node.primaryColour, 
        secondaryColour: node.secondaryColour 
      })
    )

  for (const i in expectedColours) {
    const node = nodeColours[i]
    const expected = expectedColours[i]

    try {
      expect(node).toEqual(expected)
    } catch (e) {
      let error = `Row index ${i} node colours are wrong\n\n`
      error += `Received: ${JSON.stringify(node, null, 2)}\n`
      error += `Expected: ${JSON.stringify(expected, null, 2)}\n\n`
      error += `Full: ${JSON.stringify(nodeColours, null, 2)}\n`
      error += `Expected: ${JSON.stringify(expectedColours, null, 2)}`
      throw new Error(error)
    }
  }
}

function expectLinks(links, expected) {
  function prettyLink({ y1, x1, y2, x2, colour }) {
    return {
      from_x: x1,
      to_x__: x2,
      colour
    }
  }

  try {
    expect(links.length).toBe(expected.length)
  } catch (e) {
    let error = `Expected ${expected.length} rows of links but got ${links.length}: \n\n`
    error += 'Received: ' + format(links.map(row => row.map(prettyLink))) + '\n'
    error += 'Expected: ' + format(expected.map(row => row.map(prettyLink))) + '\n\n'
    throw new Error(error)
  }

  for (const i in links) {
    const linksRow = links[i]
    const expectedRow = expected[i]

    try {
      expect(linksRow).toEqual(expectedRow)
    } catch (e) {
      let error = `Row index ${i} did not match: \n\n`
      error += 'Received: ' + format(linksRow.map(prettyLink)) + '\n'
      error += 'Expected: ' + format(expectedRow.map(prettyLink)) + '\n\n'
      error += 'Full: ' + format(links.map(row => row.map(prettyLink))) + '\n'
      error += 'Full Expected: ' + format(expected.map(row => row.map(prettyLink))) + '\n\n'
      throw new Error(error)
    }
  }
}
