export interface Processors {
  [jobName: string]: (jobData: { [key: string]: any }) => Promise<any>
}

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
