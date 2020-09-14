import { Before } from '@cucumber/cucumber'
import { dirSync } from 'tmp'
import { World } from '../world'

Before(async function (this: World) {
  this.tmpDir = dirSync().name
})
