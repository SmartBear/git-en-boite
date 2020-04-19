import path from 'path'
import fs from 'fs'
import { GitRepos, ConnectRepoRequest } from './git_repos'
import { GitRepo } from './git_repo'
import { LocalGitRepo } from './local_git_repo'
import { GitProcess } from 'dugite'
import { QueryResult } from '../query_result'

export class LocalGitRepos implements GitRepos {
  basePath: string

  constructor(basePath: string) {
    this.basePath = basePath
  }

  async connectToRemote(request: ConnectRepoRequest): Promise<void> {
    const { repoId, remoteUrl } = request
    const git = async (...args: string[]) => {
      const result = await GitProcess.exec(args, this.basePath)
      if (result.exitCode > 0) throw new Error(result.stderr)
    }
    await git('clone', remoteUrl, repoId)
  }

  findRepo(repoId: string): QueryResult<GitRepo> {
    const repoPath = path.resolve(this.basePath, repoId)
    if (!fs.existsSync(repoPath)) return new QueryResult()
    return new QueryResult(new LocalGitRepo(repoId, repoPath))
  }
}
