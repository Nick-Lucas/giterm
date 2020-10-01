import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { RightClickArea, List } from 'app/lib/primitives'
import { colours } from 'app/lib/theme'

export const Files = ({ patches, filePath, onChange }) => {
  const colourByIndex = useMemo(() => {
    return patches.map((file) => {
      if (file.isAdded) {
        return colours.TEXT.POSITIVE
      } else if (file.isDeleted) {
        return colours.TEXT.NEGATIVE
      } else if (file.isModified) {
        return colours.TEXT.ACTION
      }
    })
  }, [patches])

  return (
    <FilesContainer>
      {patches.map((patch, i) => {
        return (
          <List.Row
            active={patch.newFilePath === filePath}
            key={patch.newFilePath}
            onClick={() => onChange(patch.newFilePath)}>
            <List.Label trimStart colour={colourByIndex[i]}>
              {patch.newFilePath}
            </List.Label>
          </List.Row>
        )
      })}
    </FilesContainer>
  )
}

const FilesContainer = styled.div`
  display: flex;
  flex-direction: column;

  overflow: auto;

  flex: 1 1 0;
  max-width: 20rem;
  padding: 0.25rem 0;

  border-right: solid gray 1px;
`
