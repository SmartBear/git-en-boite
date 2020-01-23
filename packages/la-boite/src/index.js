const Koa = require("koa");
const Router = require("koa-router");
const cors = require('koa2-cors');

const app = new Koa();
const router = new Router();

const listOfFiles = ["one.js", "two.js", "a-folder/three.js"];

const serializedListOfFiles = async () => {
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
