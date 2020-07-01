import { Ref } from '.'

export interface GitRepo {
  connect(remoteUrl: string): Promise<void>
  fetch(): Promise<void>
  getRefs(): Promise<Ref[]>
  close(): Promise<void>
}

export type OpenGitRepo = (path: string) => Promise<GitRepo>
