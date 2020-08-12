import { File, Ref } from '.'

export interface GitRepo {
  commit(refName: string, branchName: string, file: File): Promise<string>
  push(refName: string, branchName: string): Promise<void>
  setOriginTo(remoteUrl: string): Promise<void>
  fetch(): Promise<void>
  getRefs(): Promise<Ref[]>
}

export type OpenGitRepo = (path: string) => Promise<GitRepo>
export type OpensGitRepos = { openGitRepo: OpenGitRepo }
