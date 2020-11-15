import { RepoId } from 'git-en-boite-core'
import path from 'path'
import { TinyTypeOf } from 'tiny-types'

export class RepoPath extends TinyTypeOf<string>() {
  static for(basePath: string, repoId: RepoId): RepoPath {
    const folderName = Buffer.from(repoId.value).toString('hex')
    return new RepoPath(path.resolve(basePath, folderName))
  }
}
