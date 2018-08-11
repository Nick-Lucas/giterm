import { Git } from './lib/git'

export default (store) => {
  const services = {
    git: new Git(),
  }

  let _cwd
  function handleCWD(cwd) {
    if (_cwd !== cwd) {
      services.git.updateCwd(cwd)
      _cwd = cwd
    }
  }

  store.subscribe(() => {
    const {
      config: { cwd },
    } = store.getState()

    handleCWD(cwd)
  })

  return services
}
