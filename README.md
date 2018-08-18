# TODO:

* App
  * Support opening from command line
  * Change app name and icon
  * Make production build/packaging work for Mac
  * Support Windows & Linux

* Config
  * set default directory for when the app is opened
  * set bash location
  * set git auth info? ssh? is this even needed if the target audience has SSH/HTTP already set up for CLI?

* Terminal
  * Performance: moving up/down in VIM causes a giterm refresh to trigger

* Status bar
  * Give functility for jump-to-branch and jump-to-commit

* Commits view
  * Support column resizing (manual or auto)
  * Show branch ahead/behind counts
  * Scroll to branch head when branch switched from command-line
  * Support merge and rebase with mouse
  * Load more than 500 commits on scroll down

* Branches view: (Not yet implemented)
  * List local branches
  * Mark current branch
  * Display commits ahead/behind
  * Double click to check out
  * Right click the rename, delete, etc