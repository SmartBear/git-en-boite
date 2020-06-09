export interface RepoTaskScheduler {
  schedule(
    repoId: string,
    name: string,
    taskData: {
      [key: string]: any
    },
  ): Promise<void>
  waitUntilIdle(repoId: string): Promise<void>
  close(): Promise<void>
}
