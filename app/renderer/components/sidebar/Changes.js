import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'

import RightClickArea from 'react-electron-contextmenu'
import { clipboard } from 'electron'

import { Section } from './Section'
import { Row, Label } from './Row'

export function Changes() {
  const _files = useSelector((state) => state.status.files) || []
  const { staged, unstaged } = useMemo(
    () => {
      const staged = []
      const unstaged = []

      for (const file of _files) {
        const colour = 'white'
        const item = {
          path: file.path,
          colour,
          menuItems: [
            {
              label: 'Copy Path',
              click: () => clipboard.writeText(file.path),
            },
          ],
        }

        if (file.staged) {
          staged.push(item)
        } else {
          unstaged.push(item)
        }
      }

      return { staged, unstaged }
    },
    [_files],
  )
  console.log({ staged, unstaged })
  return (
    <Section title="CHANGES">
      {staged.map((file) => {
        return (
          <RightClickArea key={file.path} menuItems={file.menuItems}>
            <Row>
              <Label>{file.path}</Label>
            </Row>
          </RightClickArea>
        )
      })}

      {unstaged.length > 0 && <UnstagedLabel>(unstaged)</UnstagedLabel>}

      {unstaged.map((file) => {
        return (
          <RightClickArea key={file.path} menuItems={file.menuItems}>
            <Row>
              <Label>{file.path}</Label>
            </Row>
          </RightClickArea>
        )
      })}
    </Section>
  )
}

const UnstagedLabel = styled.div`
  text-align: center;

  color: #c9ced0;
  opacity: 0.5;

  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
`
