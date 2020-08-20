import { assertThat, containsInAnyOrder, fulfilled, isRejectedWith, promiseThat } from 'hamjest'
import { stubInterface } from 'ts-sinon'

import { Branch, BranchName, GitRepo, Ref, RefName, Refs, Repo, RepoId } from '.'
import { RemoteUrl } from './remote_url'

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
      const repo = new Repo(RepoId.of('a-repo-id'), gitRepo)
      const connecting = repo.setOriginTo(RemoteUrl.of('a-remote-url'))
      finishGitConnect()
      await promiseThat(connecting, fulfilled())
    })

    it('rejects if the git command fails', async () => {
      const gitRepo = stubInterface<GitRepo>()
      gitRepo.setOriginTo.rejects(new Error('Unable to connect'))
      const repo = new Repo(RepoId.of('a-repo-id'), gitRepo)
      await promiseThat(
        repo.setOriginTo(RemoteUrl.of('a-bad-url')),
        isRejectedWith(new Error('Unable to connect')),
      )
    })
  })

  context('fetching', () => {
    it('calls the git repo to fetch', async () => {
      const gitRepo = stubInterface<GitRepo>()
      gitRepo.fetch.resolves()
      gitRepo.setOriginTo.resolves()
      const repo = new Repo(RepoId.of('a-repo-id'), gitRepo)
      await promiseThat(repo.setOriginTo(RemoteUrl.of('a-remote-url')), fulfilled())
    })
  })

  context('listing branches', () => {
    it('returns a branch for each remote ref from origin', async () => {
      const gitRepo = stubInterface<GitRepo>()
      gitRepo.getRefs.resolves(
        new Refs(
          new Ref('1', RefName.fetchedFromOrigin(BranchName.of('main'))),
          new Ref('2', RefName.fetchedFromOrigin(BranchName.of('develop'))),
          new Ref('3', RefName.forPendingCommit(BranchName.of('develop'))),
          new Ref('unlikely-this-would-happen', RefName.localBranch(BranchName.of('test'))),
        ),
      )
      const expectedBranches: Branch[] = [
        { name: BranchName.of('main'), revision: '1' },
        { name: BranchName.of('develop'), revision: '2' },
      ]
      const repo = new Repo(RepoId.of('a-repo-id'), gitRepo)
      assertThat(await repo.branches(), containsInAnyOrder(...expectedBranches))
    })
  })
})
