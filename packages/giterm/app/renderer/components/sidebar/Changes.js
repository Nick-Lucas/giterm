import React, { useMemo, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styled from 'styled-components'

import { clipboard } from 'electron'

import { Section } from './Section'
import { colours } from 'app/lib/theme'
import { RightClickArea, List } from 'app/lib/primitives'

import { diffIndex } from 'app/store/diff/actions'

export function Changes() {
  const dispatch = useDispatch()
  const handleFileSelect = useCallback(
    (filePath) => {
      dispatch(diffIndex(filePath))
    },
    [dispatch],
  )
  const diff = useSelector((state) => state.diff)
  const selectedFilePath =
    diff.show && diff.mode === 'index' ? diff.filePath : null

  const _files = useSelector((state) => state.status.files)
  const { staged, unstaged } = useMemo(() => {
    const staged = []
    const unstaged = []

    for (const file of _files || []) {
      let colour = null
      if (file.isNew) {
        colour = colours.TEXT.POSITIVE
      } else if (file.isDeleted) {
        colour = colours.TEXT.NEGATIVE
      } else if (file.isModified) {
        colour = colours.TEXT.ACTION
      }

      const item = {
        path: file.path,
        colour,
        onClick: () => handleFileSelect(file.path),
        menuItems: [
          {
            label: 'Copy Path',
            click: () => clipboard.writeText(file.path),
          },
        ],
      }

      if (file.staged) {
        staged.push(item)
      }
      if (file.unstaged) {
        unstaged.push(item)
      }
    }

    return { staged, unstaged }
  }, [_files, handleFileSelect])

  return (
    <Section
      title={`CHANGES`}
      hasContent={_files.length > 0}
      icon={
        <List.Label>
          ({staged.length}/{_files.length})
        </List.Label>
      }>
      {staged.map((file) => {
        return (
          <RightClickArea
            key={file.path}
            onClick={file.onClick}
            menuItems={file.menuItems}>
            <List.Row active={selectedFilePath === file.path}>
              <List.Label colour={file.colour} trimStart>
                {file.path}
              </List.Label>
            </List.Row>
          </RightClickArea>
        )
      })}

      {unstaged.length > 0 && <UnstagedLabel>(unstaged)</UnstagedLabel>}

      {unstaged.map((file) => {
        return (
          <RightClickArea
            key={file.path}
            onClick={file.onClick}
            menuItems={file.menuItems}>
            <List.Row active={selectedFilePath === file.path}>
              <List.Label colour={file.colour} trimStart>
                {file.path}
              </List.Label>
            </List.Row>
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
