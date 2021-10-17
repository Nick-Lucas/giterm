import React, { useMemo } from 'react'
import { useSelector } from 'app/store'

import { clipboard } from 'electron'
import { Tag } from 'react-feather'

import { Section } from './Section'
import { RightClickArea, List } from 'app/lib/primitives'

export function Tags() {
  const tags = useSelector((state) => state.tags.list)

  const menuItems = useMemo(() => {
    return tags.map((tag) => [
      {
        label: 'Copy ID',
        click: () => clipboard.writeText(tag.id),
      },
    ])
  }, [tags])

  return (
    <Section title="TAGS" initialOpenState={false} icon={<Tag size={15} />}>
      {tags.map((tag, index) => {
        return (
          <RightClickArea key={tag.id} menuItems={menuItems[index]}>
            <List.Row>
              <List.Label>{tag.name}</List.Label>
            </List.Row>
          </RightClickArea>
        )
      })}
    </Section>
  )
}
