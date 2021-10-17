export type WatcherEventType =
  | 'add'
  | 'unlink'
  | 'change'
  | 'repo-create'
  | 'repo-remove'

export type WatcherEvent = {
  event: WatcherEventType
  ref: string
  isRemote: boolean
}

export type WatcherCallback = (data: WatcherEvent) => void
