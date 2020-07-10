import { createConfig } from 'git-en-boite-config'

import { BareRepoFactory, NonBareRepoFactory } from './'
import { BackgroundGitRepos } from './background_git_repos'
import { verifyRepoContract } from './contracts/verify_repo_contract'
import { verifyRepoFactoryContract } from './contracts/verify_repo_factory_contract'
import { DugiteGitRepo } from './dugite_git_repo'

const config = createConfig()

describe(BackgroundGitRepos.name, () => {
  let gitRepos: BackgroundGitRepos
  before(async () => {
    gitRepos = await BackgroundGitRepos.connect(DugiteGitRepo, config.redis)
    await gitRepos.startWorker()
  })
  after(() => gitRepos.close())

  const openRepo = (path: string) => gitRepos.openGitRepo(path)

  const bareRepoFactory = new BareRepoFactory()
  const nonBareRepoFactory = new NonBareRepoFactory()
  verifyRepoFactoryContract(openRepo, bareRepoFactory.open)
  verifyRepoContract(openRepo, nonBareRepoFactory.open)
})
