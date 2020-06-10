import { verifyRepoFactoryContract } from 'git-en-boite-git-port'

import { TestableGitRepoFactory } from '.'

describe(TestableGitRepoFactory.name, () => {
  verifyRepoFactoryContract(new TestableGitRepoFactory(), new TestableGitRepoFactory())
})
