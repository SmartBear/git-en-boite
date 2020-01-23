const path = require('path')
const Git = require('nodegit')

module.exports = class Repo {
  constructor() {
    this._repoName = 'repository'
  }

  async getBranches() {
    const repository = await Git.Repository.open(path.resolve(this._repoName))
    return repository.getReferenceNames(Git.Reference.TYPE.ALL)
  }

  async getFiles(branchName = 'master') {
    const repository = await Git.Repository.open(path.resolve(this._repoName))
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
