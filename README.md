![Test & Deploy](https://github.com/SmartBear/git-en-boite/workflows/Run%20tests/badge.svg)

# git-en-boite

Put git in a box to make it easy to work with in your apps.

## Features

- ✅ Clone repos from 3rd party git providers - GitHub, GitLab, BitBucket etc.
- ✅ Fetch updates from origin on demand
- ✅ Create new commits on a branch and push to the origin
- Set up webhooks to automatically fetch when origin is updated (TODO)
- Emit events about changes in the repo (TODO)
- Query the repo for:
  - ✅ branch head revisions
  - file lists (TODO)
  - file contents (TODO)
- Create pull requests on 3rd party providers from a local branch (TODO)
- Read user info (orgs, repos) from 3rd party providers (TODO)

## Architecture

git-en-boite is written in typescript, and produces a [Docker image](https://hub.docker.com/repository/docker/smartbear/git-en-boite) every time the tests pass on the master branch.

It's separated into multiple NPM packages which are all contained inside this repo under `./packages`.

We use [yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces) to manage these packages.

## Start the application

The following docker-compose command starts the backend HTTP API

```bash
docker-compose up
```

Now you can hit the service:

```bash
curl http://localhost:3001
```

## Development

Install yarn, then install dependencies:

```
yarn
```

Set up default environment variables (assumes you're using [direnv](https://direnv.net/)):

```
cp .envrc.default .envrc
direnv allow .
```

The integration tests need redis and postgres to be running somewhere. If you don't have or want to have them installed on your dev machine, you can spin them up in Docker:

```bash
docker-compose up --detach redis postgres
```
On ubuntu 20, the default docker package should be replaced by the latest one to use the long syntax in docker-compose.yml
```bash
sudo curl -L "https://github.com/docker/compose/releases/download/1.27.4/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose -version
```
The version returned should be 1.27.4, build 40524192

Run the tests in each of the packages:

```
yarn test
```

Start the app locally:

```
yarn start
```

## Smoke tests

Git-en-boîte ships with smoke tests that can be run against any instance of itself.

To run them, two environment variables need to be set:

- `smoke_tests_web_server_url`: the base URL for the Git-en-boîte instance you want to test.
- `smoke_tests_remote_repo_url`: the URL of a Git repository that will be used by the smoke tests.
  [git-en-boite-demo](https://github.com/SmartBear/git-en-boite-demo) typically serves that purpose.
  Write operations are performed during the test, make sure the
  URL includes the proper credentials (e.g. a GitHub username/token pair).

Optionally, you can also set this, to test out how failures are reported in your infrastructure:

- `smoke_tests_deliberate_error`: an error message to raise as soon as the smoke tests run.

Run the smoke tests with:

    yarn smoke start

### Examples

To run against a locally-running instance:

    smoke_tests_web_server_url=http://localhost:3001 \
        smoke_tests_remote_repo_url=https://<user>:<token>@github.com/SmartBear/git-en-boite-demo\
        yarn smoke start

Run using local containers (for both the smoke tests and the running server):

    docker-compose up
    smoke_tests_remote_repo_url=https://<user>:<token>@github.com/SmartBear/git-en-boite-demo \
        docker-compose run smoke-tests yarn smoke start
