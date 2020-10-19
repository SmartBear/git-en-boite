import * as ts from 'typescript'

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string
      NODE_ENV: string
    }
  }
}

export { ProcessEnv }
