import { defineParameterType } from 'cucumber'
import { BranchName } from 'git-en-boite-core'

defineParameterType({
  name: 'branchName',
  regexp: /"(\w+)" branch/,
  transformer: value => BranchName.of(value),
})
