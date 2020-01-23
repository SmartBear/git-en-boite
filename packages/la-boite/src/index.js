const Koa = require("koa");
const Router = require("koa-router");
const cors = require('koa2-cors');
const Git = require("nodegit");

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

const getFiles = async () => {
  const repository = await Git.Repository.open('repository')
  const masterCommit = await repository.getMasterCommit()
  const tree = await masterCommit.getTree()
  const files = await walkTree(tree)

  return files
}

const serializedListOfFiles = async () => {
  const listOfFiles = await getFiles()
  return {
    data: listOfFiles.map((file, index) => ({
      type: "file",
      id: index,
      attributes: {
        path: file
      }
    }))
  };
};

app.use(cors({ origin: '*' }))

router.get("/files", async (ctx, next) => {
  ctx.body = await serializedListOfFiles()
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(3001);
