import { AsyncCommand, AsyncQuery, Handle, messageDispatch } from 'git-en-boite-command-bus'
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
import { assertThat, equalTo, fulfilled, isRejectedWith, promiseThat } from 'hamjest'
import sinon from 'sinon'

import { Ref, Repo } from '.'

describe(Repo.name, () => {
  context('handling a query for the latest Refs', () => {
    it('queries the git repo and returns (a promise of) the result', async () => {
      const expectedRefs = [new Ref('a-revision', 'a-branch')]
      const gitRepo = fakeGitRepo({
        handleConnect: sinon.stub().resolves(),
        handleGetRefs: sinon.stub().resolves(expectedRefs),
        handleFetch: sinon.stub(),
      })
      const repo = new Repo('a-repo-id', gitRepo)
      await repo.connect('a-remote-url')
      const refs = await repo.getRefs()
      assertThat(refs, equalTo(expectedRefs))
    })
  })

  context('connecting', () => {
    it('returns as soon as the git command has completed', () => {
      let finishGitConnect: () => void
      const gitConnectResult = new Promise(resolve => {
        finishGitConnect = resolve
      })
      const gitRepo = fakeGitRepo({ handleConnect: sinon.stub().returns(gitConnectResult) })
      const repo = new Repo('a-repo-id', gitRepo)
      const connecting = repo.connect('a-remote-url')
      finishGitConnect()
      promiseThat(connecting, fulfilled())
    })

    it('rejects if the git command fails', () => {
      const gitRepo = fakeGitRepo({
        handleConnect: sinon.stub().rejects(new Error('Unable to connect')),
      })
      const repo = new Repo('a-repo-id', gitRepo)
      promiseThat(repo.connect('a-bad-url'), isRejectedWith(new Error('Unable to connect')))
    })
  })

  context('fetching', () => {
    it('calls the git repo to fetch', () => {
      const gitRepo = fakeGitRepo({
        handleFetch: sinon.stub().resolves(),
      })
      const repo = new Repo('a-repo-id', gitRepo)
      promiseThat(repo.connect('a-remote-url'), fulfilled())
    })
  })
})

const fakeGitRepo = ({
  handleConnect,
  handleFetch,
  handleGetRefs,
}: {
  handleConnect?: Handle<unknown, AsyncCommand<Connect>>
  handleFetch?: Handle<unknown, AsyncCommand<Fetch>>
  handleGetRefs?: Handle<unknown, AsyncQuery<GetRefs, Ref[]>>
}) =>
  messageDispatch<BareRepoProtocol>().withHandlers({}, [
    [Connect, handleConnect || sinon.stub()],
    [Fetch, handleFetch || sinon.stub()],
    [Init, sinon.stub()],
    [SetOrigin, sinon.stub()],
    [ValidateRemote, sinon.stub()],
    [GetRefs, handleGetRefs || sinon.stub()],
    [GetConfig, sinon.stub()],
  ])
