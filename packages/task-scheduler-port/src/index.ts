export type Processor = (jobData: { [key: string]: any }) => Promise<any>

export interface Processors {
  [jobName: string]: Processor
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
  withProcessor(jobName: string, processor: Processor): RepoTaskScheduler
}
