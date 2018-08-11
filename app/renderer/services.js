import { Git } from './lib/git'

export default (cwd) => {
  return {
    git: new Git(cwd),
  }
}
