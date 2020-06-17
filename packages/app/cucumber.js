const COMMON_FLAGS = "--require-module ts-node/register --require 'features/**/*.ts'"

module.exports = {
  default: `${COMMON_FLAGS} --tags "not @wip" --format ../../node_modules/cucumber-pretty`,
  wip: `${COMMON_FLAGS} --tags @wip --format ../../node_modules/cucumber-pretty`,
}
