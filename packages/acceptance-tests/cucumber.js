const COMMON_FLAGS = [
  '--require-module ts-node/register',
  "--require './src/**/*.ts'",
  `--publish${process.env.CI ? '' : '-quiet'}`,
].join(' ')

module.exports = {
  default: `${COMMON_FLAGS} --tags "not @wip"`,
  wip: `${COMMON_FLAGS} --tags @wip`,
}
