import React, { useMemo } from 'react'
import styled from 'styled-components'

import { List } from 'app/lib/primitives'
import { colours } from 'app/lib/theme'

export const Files = ({ patches, filePath, onChange }) => {
  const colourByIndex = useMemo(() => {
    return patches.map((file) => {
      if (file.isNew) {
        return colours.TEXT.POSITIVE
      } else if (file.isDeleted) {
        return colours.TEXT.NEGATIVE
      } else {
        return colours.TEXT.ACTION
      }
    })
  }, [patches])

  return (
    <FilesContainer>
      {patches.map((patch, i) => {
        const name = patch.newName ?? patch.oldName

        return (
          <List.Row
            active={name === filePath}
            key={name}
            onClick={() => onChange(name)}>
            <List.Label trimStart colour={colourByIndex[i]}>
              {name}
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
