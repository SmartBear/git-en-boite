import path from 'path'
import { Before } from 'cucumber'
import childProcess from 'child_process'
import { promisify } from 'util'
const exec = promisify(childProcess.exec)

Before(async function () {
  this.tmpDir = path.resolve(__dirname, '../../../tmp')
  await exec(`rm -rf ${this.tmpDir}`)
})
