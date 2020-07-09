import { Job, RedisOptions, Worker } from 'bullmq'
import { OpensGitRepos } from 'git-en-boite-core'
import IORedis from 'ioredis'

export class BackgroundGitRepoWorker {
  protected worker: Worker<any>
  private redisClient: IORedis.Redis

  static async start(
    connection: RedisOptions,
    gitRepos: OpensGitRepos,
  ): Promise<BackgroundGitRepoWorker> {
    return new BackgroundGitRepoWorker(connection, gitRepos)
  }

  protected constructor(redisOptions: RedisOptions, gitRepos: OpensGitRepos) {
    // TODO: pass redisOptions once https://github.com/taskforcesh/bullmq/issues/171 fixed
    this.redisClient = new IORedis(redisOptions)
    this.worker = new Worker(
      'main',
      async (job: Job) => {
        const { path } = job.data
        const git = await gitRepos.openGitRepo(path)
        if (job.name === 'connect') {
          const { remoteUrl } = job.data
          return await git.connect(remoteUrl)
        }
        if (job.name === 'fetch') {
          return await git.fetch()
        }
      },
      { connection: this.redisClient },
    )
  }

  async close(): Promise<void> {
    await Promise.all([
      this.worker.close(),
      this.redisClient.disconnect(),
      this.worker.disconnect(),
    ])
  }
}
