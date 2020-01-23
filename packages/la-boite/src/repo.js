const path = require('path')
const Git = require('nodegit')

module.exports = class Repo {
  constructor() {
    const repoName = 'repository'
    this._openRepository = () => Git.Repository.open(path.resolve(repoName)) }

  async getBranches() {
    const repository = await this._openRepository()
    return repository.getReferenceNames(Git.Reference.TYPE.ALL)
  }

  async getFiles(branchName = 'master') {
    const repository = await this._openRepository()
    const commit = await repository.getReferenceCommit(branchName)
    const tree = await commit.getTree()
    return walkTree(tree)
  }
}

const walkTree = (tree) => {
  const treeWalker = tree.walk()
  const files = []

  return new Promise(resolve => {
    treeWalker.on('entry', function (entry) {
      files.push(entry.path())
    })
    treeWalker.on('end', function () {
      resolve(files)
    })

    treeWalker.start()
  })
}
