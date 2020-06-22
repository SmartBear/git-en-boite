import { messageDispatch, Dispatch } from 'git-en-boite-command-bus'
import {
  BareRepoProtocol,
  Connect,
  Fetch,
  GetConfig,
  GetRefs,
  Init,
  SetOrigin,
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
        [GetRefs, sinon.stub().resolves(expectedRefs)],
        [GetConfig, sinon.stub()],
      ])
      const repo = new Repo('a-repo-id', fakeGit)
      await repo.connect('a-remote-url')
      const refs = await repo.getRefs()
      assertThat(refs, equalTo(expectedRefs))
    })
  })

  context('connecting', () => {
    let fakeGit: Dispatch<BareRepoProtocol>
    let handleConnecting: Promise<unknown>
    let resolveGitConnection: (value?: unknown) => void
    let rejectGitConnection: (value?: unknown) => void

    beforeEach(() => {
      handleConnecting = new Promise((resolve, reject) => {
        resolveGitConnection = resolve
        rejectGitConnection = reject
      })
      fakeGit = messageDispatch<BareRepoProtocol>().withHandlers({}, [
        [Connect, sinon.stub().returns(handleConnecting)],
        [Fetch, sinon.stub()],
        [Init, sinon.stub()],
        [SetOrigin, sinon.stub()],
        [GetRefs, sinon.stub()],
        [GetConfig, sinon.stub()],
      ])
    })

    it('marks the connection status as "connecting"', async () => {
      const repo = new Repo('a-repo-id', fakeGit)
      const connecting = repo.connect('a-remote-url')
      assertThat(repo.connectionStatus, equalTo('connecting'))
      resolveGitConnection()
      await connecting
    })

    it('emits an event that the connection status has changed')

    context('when the connection succeeds', () => {
      it('marks the connection status as "conected"', async () => {
        const repo = new Repo('a-repo-id', fakeGit)
        const connecting = repo.connect('a-remote-url')
        resolveGitConnection()
        await connecting
        assertThat(repo.connectionStatus, equalTo('connected'))
      })
    })

    context('if the connection fails', () => {
      it('marks the connection status as "failed"', async () => {
        const repo = new Repo('a-repo-id', fakeGit)
        const connecting = repo.connect('a-remote-url')
        rejectGitConnection()
        await connecting
        assertThat(repo.connectionStatus, equalTo('failed'))
      })

      it('records the error message')
    })
  })
})
