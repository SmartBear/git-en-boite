import { BranchName, CommitName } from '.'
import { TinyType } from 'tiny-types'

export class BranchSnapshot extends TinyType {
  constructor(public readonly name: BranchName, public readonly revision: CommitName) {
    super()
  }
}
