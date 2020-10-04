import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { Hunk } from './Hunk'
import { List } from 'app/lib/primitives'

export function Diff({ filePatch }) {
  return (
    <DiffContainer>
      <PatchName>
        {filePatch.oldFilePath === filePatch.newFilePath ? (
          <List.Label trimStart textAlign="center">
            {filePatch.oldFilePath ?? filePatch.selectedFilePath}
          </List.Label>
        ) : (
          <>
            <List.Label trimStart textAlign="right">
              {filePatch.newFilePath}
            </List.Label>
            <PatchNameSeparator>{'->'}</PatchNameSeparator>
            <List.Label trimStart>{filePatch.oldFilePath}</List.Label>
          </>
        )}
      </PatchName>

      <HunksContainer>
        {filePatch.hunks.length === 0 && (
          <MessageText>Nothing to display!</MessageText>
        )}

        {filePatch.hunks.map((hunk, i) => (
          <Hunk key={`hunk_${i}`} hunk={hunk} index={i} />
        ))}
      </HunksContainer>
    </DiffContainer>
  )
}

Diff.propTypes = {
  filePatch: PropTypes.object.isRequired,
}

const DiffContainer = styled.div`
  display: flex;
  flex-direction: column;

  overflow: auto;

  flex: 3 3 0;
`

const PatchName = styled.div`
  display: block;
  flex: 0 0 auto;

  flex-direction: row;
  align-items: center;
  justify-content: center;

  padding: 0 1rem;
`

const PatchNameSeparator = styled.div`
  padding: 0 0.5rem;
`

const HunksContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 0 0 auto;

  margin-top: 1rem;
`

const MessageText = styled.div`
  text-align: center;
`
