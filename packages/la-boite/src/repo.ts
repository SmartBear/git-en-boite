import path from 'path'
import Git, { Tree, TreeEntry, Repository, Reference } from 'nodegit'

const walkTree = (tree: Tree): Promise<string[]> => {
  const treeWalker = tree.walk()
  const files: string[] = []

  return new Promise(resolve => {
    treeWalker.on('entry', (entry: TreeEntry) => {
      files.push(entry.path())
    })
    treeWalker.on('end', () => {
      resolve(files)
    })

    treeWalker.start()
  })
}

export class Repo {
  private _openRepository: () => Promise<Repository>

  constructor() {
    const repoName = 'repository'
    this._openRepository = (): Promise<Repository> => Git.Repository.open(path.resolve(repoName))
  }

  async getBranches(): Promise<string[]> {
    const repository = await this._openRepository()
    const stdVectorGitReference = await repository.getReferences()
    const branches: string[] = []

    stdVectorGitReference.forEach((reference: Reference) => {
      if (reference.isBranch() && !reference.isRemote()) {
        branches.push(reference.name())
      }
    })

    return branches
  }

  async getFiles(branchName = 'master'): Promise<string[]> {
    const repository = await this._openRepository()
    const commit = await repository.getReferenceCommit(branchName)
    const tree = await commit.getTree()
    return walkTree(tree)
  }

  async pullFromOrigin(): Promise<void> {
    const repository = await this._openRepository()
    await repository.fetchAll()
    await repository.mergeBranches('master', 'origin/master')
  }
}
