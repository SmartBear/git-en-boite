import path from 'path'
import { TinyTypeOf } from 'tiny-types'
import { RepoId } from '.'

export class RepoPath extends TinyTypeOf<string>() {
  static for(basePath: string, repoId: RepoId): RepoPath {
    const folderName = Buffer.from(repoId.value).toString('hex')
    return new RepoPath(path.resolve(basePath, folderName))
  }
}
