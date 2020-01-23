const Koa = require('koa')
const Router = require('koa-router')
const cors = require('koa2-cors')
const Git = require('nodegit')

const app = new Koa()
const router = new Router()

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

const getFiles = async (branchName = 'master') => {
  const repository = await Git.Repository.open('repository')
  const commit = await repository.getReferenceCommit(branchName)
  const tree = await commit.getTree()
  const files = await walkTree(tree)

  return files
}

const serializedListOfFiles = async (branchName = 'master') => {
  const listOfFiles = await getFiles(branchName)
  return {
    data: listOfFiles.map((file, index) => ({
      type: 'file',
      id: index,
      attributes: {
        path: file
      }
    }))
  }
}

const getBranches = async () => {
  const repository = await Git.Repository.open('repository')
  const referenceNames = await repository.getReferenceNames(Git.Reference.TYPE.LISTALL)
  return referenceNames;
}

const serializedListOfBranches = async () => {
  const branches = await getBranches()
  return {
    data: branches.map((branch, index) => ({
      type: 'branch',
      id: index,
      attributes: {
        name: branch
      }
    }))
  }
}

app.use(cors({ origin: '*' }))

router.get('/files', async (ctx, next) => {
  ctx.body = await serializedListOfFiles()
})
router.get('/files/:branch*', async (ctx, next) => {
  ctx.body = await serializedListOfFiles(ctx.params.branch)
})
router.get('/branches', async (ctx, next) => {
  ctx.body = await serializedListOfBranches()
})

app.use(router.routes()).use(router.allowedMethods())

app.listen(3001)
