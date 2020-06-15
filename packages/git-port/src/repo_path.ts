import path from 'path'
import { TinyTypeOf } from 'tiny-types'

export class RepoPath extends TinyTypeOf<string>() {
  static for(basePath: string, repoId: string): RepoPath {
    const folderName = Buffer.from(repoId).toString('hex')
    return new RepoPath(path.resolve(basePath, folderName))
  }
}
