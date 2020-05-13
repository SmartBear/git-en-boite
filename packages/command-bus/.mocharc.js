process.env['NODE_ENV'] = 'test'
module.exports = {
  "extension": ["ts"],
  "spec": "src/**/*.spec.ts",
  "require": "ts-node/register",
  "color": true
}
