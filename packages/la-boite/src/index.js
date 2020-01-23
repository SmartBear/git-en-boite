const Koa = require("koa");
const Router = require("koa-router");
const cors = require('koa2-cors');
const Git = require("nodegit");

const app = new Koa();
const router = new Router();

const getFiles = async () => {
  const repository = await Git.Repository.open('repository')
  const masterCommit = await repository.getMasterCommit()
  const entries = (await masterCommit.getTree()).entries()
  return entries.map(entry => entry.path())
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

app.use(cors({ origin: '*' }));

router.get("/files", async (ctx, next) => {
  ctx.body = await serializedListOfFiles();
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(3001);
