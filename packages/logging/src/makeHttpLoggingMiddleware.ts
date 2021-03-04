import { ServerResponse } from 'http'
import { IncomingMessage } from 'http'
import { Middleware } from 'koa'
import * as Koa from 'koa'
import { LogEvent, WriteLogEvent } from 'git-en-boite-core'

const incomingHttpRequest = (req: IncomingMessage): LogEvent => ({
  level: 'info',
  message: `-> ${req.method} ${req.url}`,
  req,
})

const outgoingHttpRequest = (req: IncomingMessage, res: ServerResponse): LogEvent => ({
  level: res.statusCode >= 500 ? 'warn' : 'info',
  message: `<- ${res.statusCode} ${req.method} ${req.url}`,
  req,
  res,
})

const httpError = (anError: Error): LogEvent => {
  const props: LogEvent = {
    level: 'error',
    message: anError.message,
    stack: anError.stack,
  }
  return Object.assign(props, anError)
}

export const makeHttpLoggingMiddleware = (log: WriteLogEvent): Middleware => {
  return async (ctx, next) => {
    log(incomingHttpRequest(ctx.req))
    ctx.res.on('finish', () => {
      log(outgoingHttpRequest(ctx.req, ctx.res))
    })
    await next()
  }
}

interface HttpServerError extends Error {
  status?: number
  expose?: boolean
}

export const logErrorsFrom = (app: Koa): { to: (log: WriteLogEvent) => Koa } => ({
  to: (log) => {
    app.on('error', (anError: HttpServerError) => anError.expose || log(httpError(anError)))
    app.silent = true
    return app
  },
})
