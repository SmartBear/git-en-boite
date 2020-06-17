import { Before } from 'cucumber'

Before(async function () {
  let nextRepoId = 0
  this.getNextRepoId = () => `repo-${nextRepoId++}`
})
