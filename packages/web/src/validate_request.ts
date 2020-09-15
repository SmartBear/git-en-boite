import { Context, Next } from 'koa'
import Ajv from 'ajv'

export default async (ctx: Context, next: Next, schema: any): Promise<void> => {
  const ajv = new Ajv({ allErrors: true })
  const validate = ajv.compile(schema)
  const valid = validate(ctx.request.body)
  if (!valid) ctx.throw(400, ajv.errorsText(validate.errors, { dataVar: 'payload' }))
  await next()
}
