import { messageDispatch, Dispatch } from 'git-en-boite-command-bus'
import {
  BareRepoProtocol,
  Connect,
  Fetch,
  GetConfig,
  GetRefs,
  Init,
  SetOrigin,
  ValidateRemote,
} from 'git-en-boite-git-port'
import { assertThat, equalTo } from 'hamjest'
import sinon from 'sinon'

import { Ref, Repo } from '.'

describe(Repo.name, () => {
  context('handling a query for the latest Refs', () => {
    it('queries the git repo and returns (a promise of) the result', async () => {
      const expectedRefs = [new Ref('a-revision', 'a-branch')]
      const fakeGit = messageDispatch<BareRepoProtocol>().withHandlers({}, [
        [Connect, sinon.stub().resolves()],
        [Fetch, sinon.stub()],
        [Init, sinon.stub()],
        [SetOrigin, sinon.stub()],
        [ValidateRemote, sinon.stub()],
        [GetRefs, sinon.stub().resolves(expectedRefs)],
        [GetConfig, sinon.stub()],
      ])
      const repo = new Repo('a-repo-id', fakeGit)
      await repo.connect('a-remote-url')
      const refs = await repo.getRefs()
      assertThat(refs, equalTo(expectedRefs))
    })
  })
})
