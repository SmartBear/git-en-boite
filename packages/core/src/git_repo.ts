import { Ref } from '.'

export interface GitRepo {
  connect(remoteUrl: string): Promise<void>
  fetch(): Promise<void>
  getRefs(): Promise<Ref[]>
}

export type OpenGitRepo = (path: string) => Promise<GitRepo>
export type OpensGitRepos = { openGitRepo: OpenGitRepo }
