export interface GitRepo {
  path: string
  branches: () => Promise<string[]>
}
