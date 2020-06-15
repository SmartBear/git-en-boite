export type Processor = (task: Task) => Promise<any>

export interface Task {
  name: string
  [key: string]: any
}

export class ConnectTask implements Task {
  public readonly name = 'connect'
  constructor(public readonly remoteUrl: string) {}
}

export class FetchTask implements Task {
  public readonly name = 'fetch'
}

export interface Processors {
  [jobName: string]: Processor
}

export interface RepoTaskScheduler {
  schedule(repoId: string, task: Task): Promise<void>
  waitUntilIdle(repoId: string): Promise<void>
  close(): Promise<void>
  withProcessor(jobName: string, processor: Processor): RepoTaskScheduler
}
