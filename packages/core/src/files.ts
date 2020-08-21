import { GitFile } from '.'

export type Files = Array<GitFile>

export class GitFiles {
  static fromRequest(files: Array<GitFile>): Files {
    return files.map((file: GitFile) => new GitFile(file.path, file.content))
  }
}
