import { Context } from 'koa'
import Router from '@koa/router'

export default (): Router =>
  new Router().get('/(.*)', async (ctx: Context) => {
    // TODO: restart HERE, the route is ready to talk to la boite
    ctx.body = ''
    ctx.response.status = 200
  })
