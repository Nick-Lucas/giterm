import { SpawnWorker } from 'main/spawn-worker'

// MIT License
// Thanks hypercwd for example implementations
// https://github.com/hharnisc/hypercwd

let getCWD: (pid: string | number) => Promise<string>
if (process.platform === 'win32') {
  console.error('Windows is not currently supported')
  alert('Windows is not currently supported :(')
  getCWD = () => Promise.resolve('/')
} else {
  getCWD = async (pid) => {
    return await SpawnWorker.exec([
      `lsof -a -F n -p ${pid} -d cwd | tail -1 | sed 's/.//'`,
    ])
  }
}

export { getCWD }
