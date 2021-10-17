import React, { useMemo } from 'react'
import styled from 'styled-components'

import { List, RightClickArea } from 'app/lib/primitives'
import { colours } from 'app/lib/theme'

import { DiffResult } from '@giterm/git'
import { clipboard } from 'electron'

interface Props {
  patches: DiffResult['files']
  filePath: string
  onChange: (path: string) => void
}

export const Files = ({ patches, filePath, onChange }: Props) => {
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
        const name = patch.newName ?? patch.oldName ?? ''

        const menuItems = []
        if (patch.oldName && patch.newName && patch.oldName !== patch.newName) {
          menuItems.push(
            {
              label: 'Copy Path (Old)',
              click: () => clipboard.writeText(patch.oldName!),
            },
            {
              label: 'Copy Path (New)',
              click: () => clipboard.writeText(patch.newName!),
            },
          )
        } else {
          menuItems.push({
            label: 'Copy Path',
            click: () => clipboard.writeText(name),
          })
        }

        return (
          <RightClickArea
            key={name}
            onClick={() => onChange(name)}
            menuItems={menuItems}>
            <List.Row active={name === filePath} key={name}>
              <List.Label trimStart colour={colourByIndex[i]}>
                {name}
              </List.Label>
            </List.Row>
          </RightClickArea>
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
