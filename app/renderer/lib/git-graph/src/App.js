import React from 'react'
import './App.css'
import styled from 'styled-components'
import { data } from './data'
import { data as data_test } from './data-test'
import { commitsToGraph } from './GitGraphRenderLib/commitsToGraph'

const colours = [
  '#058ED9',
  '#880044',
  '#E5A823',
  '#129490',
  '#875053',
  '#0055A2',
  '#96C5F7',
]

export default function App() {
  const git = window.location.pathname.includes('test') ? data_test : data

  const { nodes, links, commits } = commitsToGraph(git.commits)

  return (
    <div className="App">
      <div
        style={{
          width: '100%',
          height: 20 * nodes.length,
          position: 'relative',
        }}>
        {nodes.map((_, i) => {
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: 20 * i,
                left: 0,
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
              }}>
              <Label>
                {commits[i].sha7} {commits[i].bug ? 'BUG' : ''}
              </Label>

              <GraphContainer>
                {links[i].map((link, i) => {
                  return (
                    <Line
                      key={i}
                      x1={10 + link.x1 * 20}
                      y1={-10}
                      x2={10 + link.x2 * 20}
                      y2={10}
                      link={link}
                    />
                  )
                })}
                {links[i + 1] &&
                  links[i + 1].map((link, i) => {
                    return (
                      <Line
                        key={i}
                        x1={10 + link.x1 * 20}
                        y1={-10 + 20}
                        x2={10 + link.x2 * 20}
                        y2={10 + 20}
                        link={link}
                      />
                    )
                  })}
                {nodes[i].map((node, col) => {
                  return (
                    node.type === 'node' && (
                      <Circle cy={10} cx={10 + col * 20} r={5} node={node} />
                    )
                  )
                })}
              </GraphContainer>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const Line = styled.line`
  stroke-width: 2px;
  stroke: ${({ link: { colour } }) => colours[colour % colours.length]};
`

const Circle = styled.circle`
  stroke: ${({ node: { primaryColour } }) =>
    colours[primaryColour % colours.length]};
  stroke-width: 3px;
  fill: ${({ node: { primaryColour, secondaryColour } }) =>
    colours[(secondaryColour || primaryColour || 0) % colours.length]};
`

const Label = styled.div`
  flex: 0 0 auto;
  text-align: left;
  text-overflow: ellipsis;
  overflow: hidden;
  max-height: 20px;

  width: 100px;
`

const GraphContainer = styled.svg`
  height: 20px;
  width: 90%;
  margin-left: 10px;

  display: flex;
  flex: 1 1 auto;
`
