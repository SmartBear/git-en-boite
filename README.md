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
docker-compose run --detach --publish 6379:6379 redis
docker-compose run --detach --publish 5432:5432 postgres
```

Run the tests in each of the packages:

```
yarn test
```

Start the app locally:

```
yarn start
```
