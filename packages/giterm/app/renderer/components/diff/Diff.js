import React, { useMemo, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import NodeGit from 'nodegit'
import produce from "immer";
import _ from 'lodash'

import { Hunk } from './Hunk'

export function Diff() {
  const contextLines = 5

  const [diff, setDiff] = useState(null)
  useEffect(() => {
    async function fetch() {
      const repo = await NodeGit.Repository.open('/Users/nick/dev/giterm/')

      const sha2 = '529bbb2e074ed0cdd5fba316546eeb54704e1d37'
      const sha1 = 'bc546e06e8b7e4b561b5b859acb97e0f809eaaaf'

      // FULL COMMIT TO COMMIT DIFF
      const c1 = await (await repo.getCommit(sha1)).getTree()
      const c2 = await (await repo.getCommit(sha2)).getTree()

      const diff = await NodeGit.Diff.treeToTree(repo, c1, c2, { contextLines: contextLines })

      const stats = await diff.getStats()
      const _patches = await diff.patches()

      const patches = await Promise.all(
        _patches.map(async (patch) => {
          const oldFilePath = patch.oldFile().path()
          const newFilePath = patch.newFile().path()
          const status = patch.status()

          return {
            hunks: await Promise.all(
              (await patch.hunks()).map(async (hunk) => {
                return {
                  header: hunk.header(),
                  headerLen: hunk.headerLen(),
                  newLines: hunk.newLines(),
                  newStart: hunk.newStart(),
                  oldLines: hunk.oldLines(),
                  oldStart: hunk.oldStart(),
                  size: hunk.size(),
                  lines: (await hunk.lines()).map((line) => {
                    return {
                      content: line.content(),
                      contentLen: line.contentLen(),
                      contentOffset: line.contentOffset(),
                      newLineno: line.newLineno(),
                      numLines: line.numLines(),
                      oldLineno: line.oldLineno(),
                      origin: line.origin(),
                      rawContent: line.rawContent(),
                    }
                  }),
                }
              }),
            ),
            status,
            oldFilePath,
            newFilePath,
          }
        }),
      )

      // Later we new NodeGit.DiffLine in order to stage/unstage
      // repo.stageFilemode
      // repo.stageLines

      setDiff({
        stats: {
          insertions: stats.insertions(), 
          filesChanged: stats.filesChanged(), 
          deletions: stats.deletions(),
        },
        patches
      })
    }

    fetch()
  }, [])

  const patchIndex = 3 // Commits.js
  const changeset = useMemo(() => {
    if (!diff) return null

    const data = diff.patches[patchIndex]
    // const data = {...diff[patchIndex], hunks: [diff[patchIndex].hunks[0], diff[patchIndex].hunks[1]]}
    
    const changeset = {...data, hunks: []}

    for (const hunk of data.hunks) {    
      const linesLeft = []
      const linesRight = []

      for (const line of hunk.lines) {
        const headIndex = Math.max(linesLeft.length, linesRight.length)
        const isLeft = line.oldLineno >= 0
        const isRight = line.newLineno >= 0

        // Where line has not changed at-all we fix the row to the same index in both columns
        if (isLeft && isRight && line.contentOffset < 0) {
          linesLeft[headIndex] = line
          linesRight[headIndex] = line
          continue
        }

        // Otherwise push one at a time to keep the diff compact
        if (isLeft) {
          linesLeft.push(line)
        } 
        if (isRight) {
          linesRight.push(line)
        } 
      }

      changeset.hunks.push({ ...hunk, linesLeft, linesRight})
    }

    return changeset

  }, [diff])

  if (!changeset) {
    return <Container>Loading</Container>
  }

  console.log({changeset, diff})

  return (
    <Container>
      <PatchName>
        {changeset.oldFilePath === changeset.newFilePath ? (
          <PatchNameCell>{changeset.oldFilePath}</PatchNameCell>
        ) : (
          <>
            <PatchNameCell>{changeset.newFilePath}</PatchNameCell>
            <PatchNameSpeparator>{'->'}</PatchNameSpeparator>
            <PatchNameCell>{changeset.oldFilePath}</PatchNameCell>
          </>
        )}
      </PatchName>

      <HunksGrid>
        {changeset.hunks.map((hunk, i) => (
          <Hunk key={`hunk_${i}`} hunk={hunk} index={i} />
        ))}
      </HunksGrid>
    </Container>
  )
}

const Container = styled.div`
  position: absolute;
  top: 3%;
  bottom: 3%;
  right: 3%;
  left: 3%;

  background-color: #001825;

  overflow: auto;

  z-index: 1000;

  box-shadow: 2px 2px 15px 0px rgb(255, 255, 255, 0.3);
  border-radius: 5px;
  padding: 0.25rem 0;
`

const PatchName = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  padding: 0 1rem;
`

const PatchNameSpeparator = styled.div`
  padding: 0 0.5rem;
`

const PatchNameCell = styled.div`
  flex: 1;

  color: ${({ colour }) => colour || 'inherit'};

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  direction: rtl;
  text-align: center;
`

const HunksGrid = styled.div`
  display: grid;

  grid-auto-columns: 1fr;
`
