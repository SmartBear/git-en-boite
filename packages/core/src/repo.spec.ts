import { assertThat, equalTo, fulfilled, isRejectedWith, promiseThat } from 'hamjest'
import { stub } from 'sinon'
import { stubInterface } from 'ts-sinon'

import { GitRepo, Ref, Repo } from '.'

describe(Repo.name, () => {
  context('handling a query for the latest Refs', () => {
    it('queries the git repo and returns (a promise of) the result', async () => {
      const expectedRefs = [new Ref('a-revision', 'a-branch')]
      const gitRepo = stubInterface<GitRepo>()
      gitRepo.connect.resolves()
      gitRepo.getRefs.resolves(expectedRefs)
      const repo = new Repo('a-repo-id', gitRepo)
      await repo.connect('a-remote-url')
      const refs = await repo.getRefs()
      assertThat(refs, equalTo(expectedRefs))
    })
  })

  context('connecting', () => {
    it('returns as soon as the git command has completed', async () => {
      let finishGitConnect: () => void
      const gitRepo = stubInterface<GitRepo>()
      gitRepo.connect.returns(
        new Promise(resolve => {
          finishGitConnect = resolve
        }),
      )
      const repo = new Repo('a-repo-id', gitRepo)
      const connecting = repo.connect('a-remote-url')
      finishGitConnect()
      await promiseThat(connecting, fulfilled())
    })

    it('rejects if the git command fails', async () => {
      const gitRepo = stubInterface<GitRepo>()
      gitRepo.connect.rejects(new Error('Unable to connect'))
      const repo = new Repo('a-repo-id', gitRepo)
      await promiseThat(repo.connect('a-bad-url'), isRejectedWith(new Error('Unable to connect')))
    })
  })

  context('fetching', () => {
    it('calls the git repo to fetch', async () => {
      const gitRepo = stubInterface<GitRepo>()
      gitRepo.fetch.resolves()
      gitRepo.connect.resolves()
      const repo = new Repo('a-repo-id', gitRepo)
      await promiseThat(repo.connect('a-remote-url'), fulfilled())
    })
  })
})
