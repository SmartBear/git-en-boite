const path = require('path')

const  p = (subPath) => path.resolve(__dirname, subPath)

module.exports = {
  extension: ['ts'],
  recursive: true,
  require: 'ts-node/register',
  spec: [p('src/**/*.spec.ts')],
  'watch-files': [p('src/**/*.ts')],
}
