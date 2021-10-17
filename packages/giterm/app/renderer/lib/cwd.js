import { remote } from '@electron/remote'

const pwd = process.cwd()
const homeDir = remote.app.getPath('home')

export const INITIAL_CWD = pwd === '/' ? homeDir : pwd
