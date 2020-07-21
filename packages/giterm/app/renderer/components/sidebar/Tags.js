import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'

import RightClickArea from 'react-electron-contextmenu'
import { clipboard } from 'electron'

import { Section } from './Section'
import { Row, Label } from './Row'

export function Tags() {
  const _tags = useSelector((state) => state.tags) || []

  const tags = useMemo(() => {
    const tags = []

    for (const tag of _tags) {
      tags.push({
        id: tag.id,
        name: tag.name,
        menuItems: [
          {
            label: 'Copy ID',
            click: () => clipboard.writeText(tag.id),
          },
        ],
      })
    }

    return tags
  }, [_tags])

  return (
    <Section title="TAGS" initialOpenState={false}>
      {tags.map((tag) => {
        return (
          <RightClickArea key={tag.id} menuItems={tag.menuItems}>
            <Row>
              <Label>{tag.name}</Label>
            </Row>
          </RightClickArea>
        )
      })}
    </Section>
  )
}
