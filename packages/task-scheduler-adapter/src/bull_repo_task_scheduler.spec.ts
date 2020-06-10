import { BullRepoTaskScheduler } from './bull_repo_task_scheduler'
import { createConfig } from 'git-en-boite-config'
import { eventually } from 'ts-eventually'
import { assertThat, is, truthy, falsey } from 'hamjest'
import { Task, RepoTaskScheduler } from 'git-en-boite-task-scheduler-port'

const config = createConfig()

describe('BullRepoTaskScheduler', () => {
  class TestTask implements Task {
    public name = 'test'
  }

  let taskScheduler: RepoTaskScheduler
  afterEach(async () => await taskScheduler.close())

  it('processes a task that succeeds', async () => {
    let result: boolean
    taskScheduler = BullRepoTaskScheduler.make(config.redis).withProcessor('test', async () => {
      result = true
    })
    await taskScheduler.schedule('repo-1', new TestTask())
    await eventually(async () => assertThat(result, is(truthy())), 1, 0.1)
  })

  it('waits until a repo is idle', async () => {
    const wait = (ms: number) =>
      new Promise(resolve =>
        setTimeout(() => {
          resolve()
        }, ms),
      )
    let result: boolean
    taskScheduler = BullRepoTaskScheduler.make(config.redis).withProcessor('test', async () =>
      wait(10).then(() => (result = true)),
    )
    await taskScheduler.schedule('repo-1', new TestTask())
    assertThat(result, is(falsey()))
    await taskScheduler.waitUntilIdle('repo-1')
    assertThat(result, is(truthy()))
  })
})
