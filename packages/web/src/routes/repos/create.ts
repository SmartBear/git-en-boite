import Router from '@koa/router'
import { Application, RemoteUrl, RepoId } from 'git-en-boite-core'
import LinkHeader from 'http-link-header'
import { Context } from 'koa'

import validateRequestBody from '../../validate_request'
import { handleRepoErrors } from './handleRepoErrors'

const schema = {
  type: 'object',
  title: 'request-payload',
  properties: {
    remoteUrl: { type: 'string' },
  },
  required: ['remoteUrl'],
}

type ParsedBody = { remoteUrl: RemoteUrl }

const parseBody: (body: any) => ParsedBody = (body: any) => ({
  remoteUrl: RemoteUrl.fromJSON(body.remoteUrl),
})

export default (app: Application, router: Router): Router =>
  new Router().post(
    '/',
    async (ctx, next) => validateRequestBody(ctx, next, schema),
    handleRepoErrors,
    async (ctx: Context) => {
      const parsedBody: ParsedBody = parseBody(ctx.request.body)
      const { remoteUrl } = parsedBody
      const repoId = RepoId.generate()
      await app.connectToRemote(repoId, remoteUrl)
      ctx.response.status = 201
      ctx.response.set(
        'Link',
        new LinkHeader().set({ rel: 'item', uri: router.url('get-repo', { repoId: repoId.urlEncode() }) }).toString()
      )
    }
  )
