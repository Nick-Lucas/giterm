import { exec } from 'child_process'

// MIT License
// Thanks hypercwd for example implementations
// https://github.com/hharnisc/hypercwd

let getCWD: (pid: string | number) => Promise<string>
if (process.platform === 'win32') {
  console.error('Windows is not currently supported')
  alert('Windows is not currently supported :(')
  getCWD = () => Promise.resolve('/')
} else {
  getCWD = async (pid) =>
    new Promise((resolve, reject) => {
      exec(
        `lsof -a -F n -p ${pid} -d cwd | tail -1 | sed 's/.//'`,
        (e, stdout) => {
          if (e) {
            reject(e)
          } else {
            resolve(stdout)
          }
        },
      )
    })
}

export { getCWD }
