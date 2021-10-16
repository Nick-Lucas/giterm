export const TAGS_UPDATED = 'tags/updated'

import { TagRefs } from '@giterm/git'

export const tagsUpdated = (tags: TagRefs) => ({
  type: TAGS_UPDATED,
  tags,
})
