# TODO:

* Allow setting of git repo
  * giterm cli to take path

* Settings
  * set default directory
  * set bash location
  * set git auth info? ssh?

* Terminal
  * Allow commands to be injected into it (ie. branch switched -> run `git status`)
  * Add fullscreen view for when git runs vim, and recognise it starting a fullscreen session
  * BUG: Fix 'move up' in vim

* Branches view:
  * List local branches
  * Mark current branch
  * Display commits ahead/behind
  * Double click to check out
  * Right click the rename, delete, etc

* Commits view
  * Show branch ahead/behind counts
  * Allow inclusion of origin in view

* HUD strip
  * Show current status at top (`x files changed`, `rebasing`, etc)
