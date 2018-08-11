# TODO:

* Allow setting of git repo
  * giterm cli to take path
  * make terminal switching folder update the cwd of giterm, handle lack of git repo!

* Terminal
  * Allow commands to be injected into it (ie. branch switched -> run `git status`)
  * Add fullscreen view for when git runs vim, and recognise it starting a fullscreen session
  * BUG: Fix 'move up' in vim
  * Inject custom aliases into bash:
    * ga - git add
    * gaa - git add --all
    * gs - git status
    * gc - git commit -m
    * gp - git push
    * gpf - git push --force-with-lease
    * gc - git checkout
    * help - display alias documentation

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
