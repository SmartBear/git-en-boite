import { createConfig } from 'git-en-boite-config'

import { BareRepoFactory, NonBareRepoFactory } from './'
import { BackgroundGitRepos } from './background_git_repos'
import { BackgroundGitRepoWorker } from './background_git_repo_worker'
import { verifyRepoContract } from './contracts/verify_repo_contract'
import { verifyRepoFactoryContract } from './contracts/verify_repo_factory_contract'
import { DugiteGitRepo } from './dugite_git_repo'

const config = createConfig()

describe(BackgroundGitRepos.name, () => {
  const gitRepos = new BackgroundGitRepos(DugiteGitRepo, config.redis)
  after(() => gitRepos.close())

  const openRepo = (path: string) => gitRepos.openGitRepo(path)

  const bareRepoFactory = new BareRepoFactory()
  const nonBareRepoFactory = new NonBareRepoFactory()
  verifyRepoFactoryContract(openRepo, bareRepoFactory.open)
  verifyRepoContract(openRepo, nonBareRepoFactory.open)

  let worker: BackgroundGitRepoWorker
  beforeEach(async () => {
    worker = await BackgroundGitRepoWorker.start(config.redis, DugiteGitRepo)
  })
  afterEach(() => worker.close())
})
