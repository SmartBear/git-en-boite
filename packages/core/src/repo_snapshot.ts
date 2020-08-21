import { BranchSnapshot, RepoId } from '.'
import { TinyType } from 'tiny-types'

export class RepoSnapshot extends TinyType {
  constructor(public readonly repoId: RepoId, public readonly branches: BranchSnapshot[]) {
    super()
  }
}
