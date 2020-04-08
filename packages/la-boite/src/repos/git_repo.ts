export interface GitRepo {
  path: string
  id: string
  branches: () => Promise<string[]>
}
