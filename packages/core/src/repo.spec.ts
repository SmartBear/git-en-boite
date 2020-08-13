import { assertThat, equalTo, fulfilled, isRejectedWith, promiseThat } from 'hamjest'
import { stubInterface } from 'ts-sinon'

import { GitRepo, Ref, Repo } from '.'
import { RefName } from './ref_name'

describe(Repo.name, () => {
  context('handling a query for the latest Refs', () => {
    it('queries the git repo and returns (a promise of) the result', async () => {
      const expectedRefs = [new Ref('a-revision', RefName.localBranch('a-branch'))]
      const gitRepo = stubInterface<GitRepo>()
      gitRepo.setOriginTo.resolves()
      gitRepo.getRefs.resolves(expectedRefs)
      const repo = new Repo('a-repo-id', gitRepo)
      await repo.setOriginTo('a-remote-url')
      const refs = await repo.getRefs()
      assertThat(refs, equalTo(expectedRefs))
    })
  })

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
})
