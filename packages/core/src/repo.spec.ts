import { commandBus } from 'git-en-boite-command-bus'
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
import { stubInterface } from 'ts-sinon'

import { Ref, Repo, SingleRepoTaskScheduler } from '.'

describe(Repo.name, () => {
  context('handling a query for the latest Refs', () => {
    it('queries the git repo and returns (a promise of) the result', async () => {
      const expectedRefs = [new Ref('a-revision', 'a-branch')]
      const fakeGit = commandBus<BareRepoProtocol>().withHandlers({}, [
        [Connect, sinon.stub()],
        [Fetch, sinon.stub()],
        [Init, sinon.stub()],
        [SetOrigin, sinon.stub()],
        [GetRefs, sinon.stub().resolves(expectedRefs)],
        [GetConfig, sinon.stub()],
      ])
      const repo = new Repo('a-repo-id', fakeGit)
      const refs = await repo.getRefs()
      assertThat(refs, equalTo(expectedRefs))
    })
  })

  context('connecting', () => {
    it.only('delegates the Connect git command to the task scheduler', async () => {
      const expectedRefs = [new Ref('a-revision', 'a-branch')]
      const fakeGit = commandBus<BareRepoProtocol>().withHandlers({}, [
        [Connect, sinon.stub()],
        [Fetch, sinon.stub()],
        [Init, sinon.stub()],
        [SetOrigin, sinon.stub()],
        [GetRefs, sinon.stub().resolves(expectedRefs)],
        [GetConfig, sinon.stub()],
      ])
      const taskScheduler = stubInterface<SingleRepoTaskScheduler>()
      const repo = new Repo('a-repo-id', fakeGit, taskScheduler)
      const remoteUrl = 'repo-remote-url'
      await repo.connect(remoteUrl)
      assertThat(taskScheduler.schedule.calledWith(Connect.toUrl(remoteUrl)), equalTo(true))
    })

    it('marks the connection status as "connecting"')

    context('when the task succeeds', () => {
      it('marks the connection status as "conected"')
    })

    context('if the task fails', () => {
      it('marks the connection status as "failed"')
      it('records the error message')
    })
  })
})
