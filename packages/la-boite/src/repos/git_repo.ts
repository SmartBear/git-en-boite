import { Reference } from './reference'

export interface GitRepo {
  refs(): Promise<Reference[]>
  path: string
}
