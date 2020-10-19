import { spawn } from 'child_process'
import path from 'path'

export const runSmokeTests = async (url: string): Promise<void> => {
  if (!process.env.smoke_tests_remote_repo_url) return
  const cwd = path.resolve(__dirname)
  const child = spawn('yarn', ['start'], {
    cwd,
    stdio: 'inherit',
    env: {
      ...process.env,
      smoke_tests_web_server_url: url,
    },
  })

  return new Promise((resolve, reject) => {
    child.on('exit', status => {
      if (status !== 0) return reject(new Error('Smoke tests failed'))
      resolve()
    })
  })
}
