import { createConfig } from './config'
import WebApp from './web_app'
import Router from './router'
import { LocalGitRepos } from './repos/local_git_repos'
import { Application } from './application'
import { core } from 'git-en-boite-core'

const config = createConfig(process.env)
console.log(`git-en-boite starting up`)
console.log(`Using config: ${JSON.stringify(config, null, 2)}`)

// check we can call the core
core()

const app = { repos: new LocalGitRepos(config.git.root) } as Application

const routes = Router.create(app)
const webApp = WebApp.withRoutes(routes)
const port = 3001
const host = 'localhost'
webApp.listen(port)
console.log(`Server listening on http://${host}:${port}`)
