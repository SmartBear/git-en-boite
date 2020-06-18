import { Job, Queue, QueueBase, RedisOptions, Worker } from 'bullmq'
import { Connect } from 'git-en-boite-git-port'
import {
  GitTasksFactory,
  Processor,
  Processors,
  RepoTaskScheduler,
  SingleRepoTaskScheduler,
  Task,
  ConnectTask,
} from 'git-en-boite-task-scheduler-port'
import IORedis from 'ioredis'

export type QueueComponents = [Queue, Worker]

class GitTasks implements SingleRepoTaskScheduler {
  constructor(private readonly taskScheduler: RepoTaskScheduler, private readonly repoId: string) {}

  async schedule(message: Connect) {
    await this.taskScheduler.schedule(this.repoId, new ConnectTask(message.remoteUrl))
  }
}

export class BullRepoTaskScheduler implements RepoTaskScheduler, GitTasksFactory {
  private constructor(
    private readonly processors: Processors,
    private repoQueueComponents: Map<string, QueueComponents>,
    private closables: QueueBase[],
    private redisOptions: RedisOptions,
  ) {}

  static make(redisOptions: RedisOptions): BullRepoTaskScheduler {
    return new this({}, new Map(), [], redisOptions)
  }

  withProcessor(jobName: string, processor: Processor): RepoTaskScheduler {
    return new BullRepoTaskScheduler(
      { ...this.processors, [jobName]: processor },
      this.repoQueueComponents,
      this.closables,
      this.redisOptions,
    )
  }

  forRepo(repoId: string): SingleRepoTaskScheduler {
    return new GitTasks(this, repoId)
  }

  async close(): Promise<void> {
    await Promise.all(
      this.closables.map(async closable => {
        await closable.close()
        // TODO: remove workaround when issues are fixed in bullmq:
        // https://github.com/taskforcesh/bullmq/issues/180
        // https://github.com/taskforcesh/bullmq/issues/159
        if (closable instanceof Worker)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (await (closable as any).blockingConnection.client).disconnect()
        await closable.disconnect()
      }),
    )
  }

  async schedule(repoId: string, task: Task): Promise<void> {
    const queue = this.getQueue(repoId)
    await queue.add(task.name, task)
  }

  async waitUntilIdle(repoId: string): Promise<void> {
    const [queue, worker] = this.getQueueComponentsForRepo(repoId)
    const counts = await queue.getJobCounts()
    if (counts.active === 0 && counts.delayed === 0 && counts.waiting === 0)
      return Promise.resolve()
    return new Promise(resolve => worker.on('drained', resolve))
  }

  private getQueue(repoId: string): Queue {
    const [queue] = this.getQueueComponentsForRepo(repoId)
    return queue
  }

  private getQueueComponentsForRepo(repoId: string): QueueComponents {
    if (!this.repoQueueComponents.has(repoId))
      this.repoQueueComponents.set(repoId, this.createRepoQueue(repoId))
    return this.repoQueueComponents.get(repoId)
  }

  private createRepoQueue(repoId: string): QueueComponents {
    const connection = new IORedis(this.redisOptions)
    const queue = new Queue(repoId, { connection })
    const worker = new Worker(
      repoId,
      (job: Job) => {
        const processor = this.processors[job.name] || ((): Promise<void> => undefined)
        return processor({ repoId, ...job.data })
      },
      { connection },
    )
    worker.on('failed', (job, err) =>
      console.error(
        `Worker failed while processing job #${job.id} "${job.name}" for repo "${repoId}"`,
        err,
      ),
    )
    this.closables.push(queue)
    this.closables.push(worker)
    return [queue, worker]
  }
}
