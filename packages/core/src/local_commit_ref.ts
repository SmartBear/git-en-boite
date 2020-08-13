import { TinyType } from 'tiny-types'
import { CommitRef } from '.'

export class LocalCommitRef extends TinyType implements CommitRef {
  constructor(public readonly branchName: string, public readonly local: string) {
    super()
  }

  static forBranch(branchName: string): LocalCommitRef {
    const localRef = `refs/heads/${branchName}`
    return new LocalCommitRef(branchName, localRef)
  }
}
