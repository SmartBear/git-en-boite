import { GitFile } from '.'

export class GitFiles {
  static fromRequest(files: Array<GitFile>): GitFile[] {
    return files.map((file: GitFile) => new GitFile(file.path, file.content))
  }
}
