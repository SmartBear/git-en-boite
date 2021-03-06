import { defineParameterType } from '@cucumber/cucumber'
import { BranchName } from 'git-en-boite-core'

defineParameterType({
  name: 'BranchName',
  regexp: /(?:the )?"(\w+)" branch/,
  transformer: (value) => BranchName.of(value),
})
