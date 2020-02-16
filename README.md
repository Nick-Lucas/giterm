[![Build Status](https://dev.azure.com/me0457/Giterm/_apis/build/status/Nick-Lucas.giterm?branchName=master)](https://dev.azure.com/me0457/Giterm/_build/latest?definitionId=1&branchName=master)

## giterm

Electron/React based git tool, with a terminal at its heart, and all the best parts of a git GUI.

This project is still under heavy development, and any contributions or feedback are very welcome! 

I'm building giterm because I love to work on the CLI but miss the visualisation and simplicity which git GUIs can offer. That's the vision!

![giterm](docs/assets/app.png)

## How to run it?

Check of the [releases](https://github.com/Nick-Lucas/giterm/releases) tab

## Building locally

1. checkout
2. `yarn`/`npm install` (NodeGit can take a while to build, so be patient)
3. `yarn run develop` or `npm run develop`. 

## Usage

Load up giterm and use the command line as normal! 

* When you change folder so will giterm
* giterm has a bunch of bash aliases ready for you (type `help`)
* If you want a fullscreen terminal just press `ctrl+tab` to toggle it, but giterm will do this for you when you enter vim or other fullscreen apps

## Work in progress!

* giterm probably only works on Mac right now. There are some dependencies like bash and lsof/grep/awk which are currently required
* Cross-platform support is a personal priority! I'm also a Windows user at times, and Linux should be trivial with Mac support. Help here is especially welcome.

## Todo

Check out the github issues for details!
