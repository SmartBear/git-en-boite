import { File, Ref } from '.'

export interface GitRepo {
  commit(branchName: string, file: File): Promise<void>
  setOriginTo(remoteUrl: string): Promise<void>
  fetch(): Promise<void>
  getRefs(): Promise<Ref[]>
}

export type OpenGitRepo = (path: string) => Promise<GitRepo>
export type OpensGitRepos = { openGitRepo: OpenGitRepo }
