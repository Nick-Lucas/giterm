import type { Reducer as Diff } from './diff/reducer'
import type { Reducer as Branches } from './branches/reducer'
import type { Reducer as Tags } from './tags/reducer'

export type Store = {
  diff: Diff
  branches: Branches
  tags: Tags
}
