import {
  assertThat,
  equalTo,
  fulfilled,
  isRejectedWith,
  promiseThat,
  containsInAnyOrder,
} from 'hamjest'
import { stubInterface } from 'ts-sinon'

import { GitRepo, Ref, Repo, Refs, Branch } from '.'
import { RefName } from './ref_name'

describe(Repo.name, () => {
  context('connecting', () => {
    it('returns as soon as the git command has completed', async () => {
      let finishGitConnect: () => void
      const gitRepo = stubInterface<GitRepo>()
      gitRepo.setOriginTo.returns(
        new Promise(resolve => {
          finishGitConnect = resolve
        }),
      )
      const repo = new Repo('a-repo-id', gitRepo)
      const connecting = repo.setOriginTo('a-remote-url')
      finishGitConnect()
      await promiseThat(connecting, fulfilled())
    })

    it('rejects if the git command fails', async () => {
      const gitRepo = stubInterface<GitRepo>()
      gitRepo.setOriginTo.rejects(new Error('Unable to connect'))
      const repo = new Repo('a-repo-id', gitRepo)
      await promiseThat(
        repo.setOriginTo('a-bad-url'),
        isRejectedWith(new Error('Unable to connect')),
      )
    })
  })

  context('fetching', () => {
    it('calls the git repo to fetch', async () => {
      const gitRepo = stubInterface<GitRepo>()
      gitRepo.fetch.resolves()
      gitRepo.setOriginTo.resolves()
      const repo = new Repo('a-repo-id', gitRepo)
      await promiseThat(repo.setOriginTo('a-remote-url'), fulfilled())
    })
  })

  context('listing branches', () => {
    it('returns a branch for each remote ref from origin', async () => {
      const gitRepo = stubInterface<GitRepo>()
      gitRepo.getRefs.resolves(
        new Refs(
          new Ref('1', RefName.fetchedFromOrigin('main')),
          new Ref('2', RefName.fetchedFromOrigin('develop')),
          new Ref('3', RefName.forPendingCommit('develop')),
          new Ref('unlikely-this-would-happen', RefName.localBranch('test')),
        ),
      )
      const expectedBranches: Branch[] = [
        { name: 'main', revision: '1' },
        { name: 'develop', revision: '2' },
      ]
      const repo = new Repo('a-repo-id', gitRepo)
      assertThat(await repo.branches(), containsInAnyOrder(...expectedBranches))
    })
  })
})
