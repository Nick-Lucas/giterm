import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { clipboard } from 'electron'
import { Target } from 'react-feather'

import { Section } from './Section'
import { RightClickArea, List } from 'app/lib/primitives'

export function Tags() {
  const _tags = useSelector((state) => state.tags.list)

  const tags = useMemo(() => {
    const tags = []

    for (const tag of _tags || []) {
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
    <Section title="TAGS" initialOpenState={false} icon={<Target size={15} />}>
      {tags.map((tag) => {
        return (
          <RightClickArea key={tag.id} menuItems={tag.menuItems}>
            <List.Row>
              <List.Label>{tag.name}</List.Label>
            </List.Row>
          </RightClickArea>
        )
      })}
    </Section>
  )
}
