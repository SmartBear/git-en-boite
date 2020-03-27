import * as ts from 'typescript'

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GIT_EN_BOITE_PG_URL: string
      NODE_ENV: string
    }
  }
}

export { ProcessEnv }
