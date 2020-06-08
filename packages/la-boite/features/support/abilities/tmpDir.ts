import { Before } from 'cucumber'
import { dirSync } from 'tmp'

Before(async function () {
  this.tmpDir = dirSync().name
})
