export interface GitRepo {
  refs(): any
  path: string
  branches: () => Promise<string[]>
}
