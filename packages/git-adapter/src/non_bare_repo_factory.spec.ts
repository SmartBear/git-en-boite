import { verifyRepoFactoryContract } from 'git-en-boite-git-port'

import { NonBareRepoFactory } from './'

describe(NonBareRepoFactory.name, () => {
  verifyRepoFactoryContract(new NonBareRepoFactory(), new NonBareRepoFactory())
})
