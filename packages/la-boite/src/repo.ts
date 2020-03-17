import path from 'path'
import Git from 'nodegit'

export class Repo {
  private _openRepository: any

  constructor() {
    const repoName = 'repository'
    this._openRepository = () => Git.Repository.open(path.resolve(repoName))
  }

  async getBranches() {
    const repository = await this._openRepository()
    const stdVectorGitReference = await repository.getReferences()
    const branches: string[] = []

    stdVectorGitReference.forEach((reference: any) => {
      if (reference.isBranch() && !reference.isRemote()) {
        branches.push(reference.name())
      }
    })

    return branches
  }

  async getFiles(branchName = 'master') : Promise<string[]> {
    const repository = await this._openRepository()
    const commit = await repository.getReferenceCommit(branchName)
    const tree = await commit.getTree()
    return walkTree(tree)
  }

  async pullFromOrigin() {
    const repository = await this._openRepository()
    await repository.fetchAll()
    await repository.mergeBranches("master", "origin/master")
  }
}

const walkTree = (tree: any): Promise<string[]> => {
  const treeWalker = tree.walk()
  const files: string[] = []

  return new Promise(resolve => {
    treeWalker.on('entry', (entry: any) => {
      files.push(entry.path())
    })
    treeWalker.on('end', () => {
      resolve(files)
    })

    treeWalker.start()
  })
}
