import { getPath, spawn } from '../spawn'

export async function rebuild() {
  await spawn('yarn', ['run', 'build-js'], getPath(''))

  await spawn('yarn', ['run', 'private:clean'], getPath('packages/giterm'))
  await spawn('yarn', ['run', 'private:compile'], getPath('packages/giterm'))
}
