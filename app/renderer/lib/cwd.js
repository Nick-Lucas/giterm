import { remote } from 'electron'

const pwd = process.cwd()
const homeDir = remote.app.getPath('home')

export const INITIAL_CWD = pwd === '/' ? homeDir : pwd
