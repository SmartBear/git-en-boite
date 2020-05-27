import { Application } from 'git-en-boite-client-port'

import { createConfig } from './config'
import { LocalGitRepos } from './repos/local_git_repos'
import { createWebApp } from 'git-en-boite-client-adapter-web'

const config = createConfig(process.env)
console.log(`git-en-boite starting up`)
console.log(`Using config: ${JSON.stringify(config, null, 2)}`)

const app: Application = {
  repos: new LocalGitRepos(config.git.root),
  version: config.version,
}

const port = 3001
const host = 'localhost'
const webApp = createWebApp(app)
webApp.listen(port)
console.log(`Server listening on http://${host}:${port}`)
