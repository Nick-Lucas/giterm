export const STATE = {
  NO_REPO: 'NO_REPO',
  REBASING: 'REBASING',
  MERGING: 'MERGING',
  CHERRY_PICKING: 'CHERRY_PICKING',
  REVERTING: 'REVERTING',
  BISECTING: 'BISECTING',
  APPLYING_MAILBOX: 'APPLYING_MAILBOX',
  OK: 'OK',
}

export const STATE_FILES = {
  HEAD_FILE: 'HEAD',
  ORIG_HEAD_FILE: 'ORIG_HEAD',
  FETCH_HEAD_FILE: 'FETCH_HEAD',
  MERGE_HEAD_FILE: 'MERGE_HEAD',
  REVERT_HEAD_FILE: 'REVERT_HEAD',
  CHERRYPICK_HEAD_FILE: 'CHERRY_PICK_HEAD',
  BISECT_LOG_FILE: 'BISECT_LOG',
  REBASE_MERGE_DIR: 'rebase-merge/',
  REBASE_MERGE_INTERACTIVE_FILE: 'rebase-merge/interactive',
  REBASE_APPLY_DIR: 'rebase-apply/',
  REBASE_APPLY_REBASING_FILE: 'rebase-apply/rebasing',
  REBASE_APPLY_APPLYING_FILE: 'rebase-apply/applying',
}
