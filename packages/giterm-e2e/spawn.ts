import path from 'path'
import child_process from 'child_process'

export const getPath = (absolute: string) =>
  path.normalize(path.join(__dirname, '../..', absolute))

export const spawn = async (
  command: string,
  args: string[],
  cwd: string,
): Promise<void> => {
  const child = child_process.spawn(command, args, {
    cwd: cwd,
    stdio: 'inherit',
    env: {
      ...process.env,
      E2E: '1',
    },
  })

  return new Promise<void>((resolve, reject) => {
    child.once('exit', (code) => {
      if (code == 0) {
        resolve()
      } else {
        reject()
      }
    })
  })
}
