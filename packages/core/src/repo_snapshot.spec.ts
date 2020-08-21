import { BranchName, BranchSnapshot, CommitName, RepoId, RepoSnapshot } from '.'
import { assertThat, equalTo } from 'hamjest'

describe(RepoSnapshot.name, () => {
  it('deserialises from valid JSON', () => {
    const repoId = RepoId.of('a-repo-id')
    const branches = [new BranchSnapshot(BranchName.of('a-branch'), CommitName.of('a-revision'))]
    const repoSnapshot = RepoSnapshot.fromJSON(new RepoSnapshot(repoId, branches).toJSON())
    assertThat(repoSnapshot.repoId, equalTo(repoId))
    assertThat(repoSnapshot.branches, equalTo(branches))
  })
})
