![Test & Deploy](https://github.com/SmartBear/git-en-boite/workflows/Run%20tests/badge.svg)

# git-en-boite

Put git in a box to make it easy to work with in your apps.

## Features

- ✅ Clone repos from 3rd party git providers - GitHub, GitLab, BitBucket etc.
- ✅ Fetch updates from origin on demand
- ✅ Create new commits on a branch and push to the origin
- Set up webhooks to automatically fetch when origin is updated (TODO)
- ✅ Emit events about changes in the repo
- Query the repo for:
  - ✅ branch head revisions
  - file/directory listings (TODO)
  - ✅ file contents
- Authenticate all requests (TODO)
- Create pull requests on 3rd party providers from a local branch (TODO)
- Read user info (orgs, repos) from 3rd party providers (TODO)

## Tech stack

git-en-boite is written in Typescript, and produces a [Docker image](https://hub.docker.com/repository/docker/smartbear/git-en-boite) every time the tests pass on the master branch.

It's separated into multiple NPM packages which are all contained inside this repo under `./packages`.

We use [yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces) to manage these packages.

## Start the application

The following docker-compose command starts the backend HTTP API

    docker-compose up

Now you can hit the service:

    curl http://localhost:3001

## Development

Install yarn, then install dependencies:

    yarn

Set up default environment variables (assumes you're using [direnv](https://direnv.net/)):

    cp .envrc.default .envrc
    direnv allow .

The integration tests need redis to be running somewhere. If you don't have or want to have it installed on your dev machine, you can spin it up in Docker:

    docker-compose up --detach redis

### Note for Ubuntu 20 users

On ubuntu 20, the default docker package should be replaced by the latest one to use the long syntax in docker-compose.yml

    sudo curl -L "https://github.com/docker/compose/releases/download/1.27.4/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    docker-compose -version

The version returned should be 1.27.4, build 40524192

### Run tests

Build first:

    yarn build

Run the tests in each of the packages:

    yarn test

### Debugging the acceptance tests

When the acceptance tests fail, it's often useful to debug them by logging. You can turn on logging to console like this:

    LOGGING_READABLE_BY=humans yarn acceptance test

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

## Releasing

Git-en-boite is automatically packaged as a new docker image each time the CI build runs succesfully on the `main` branch. The docker image is tagged with the git sha of the commit.

To make a semantially-versioned release of the docker-image:

1. Make sure you've closed the GitHub issues that were in the release. This will trigger a [bot workflow](https://github.com/SmartBear/git-en-boite/blob/main/.github/workflows/changelog.yml) to update the [changelog](https://github.com/SmartBear/git-en-boite/blob/main/CHANGELOG.md).

2. Update the root `package.json` file and tag the git commit:

```
yarn version --major|minor|patch # choose the right switch depending on the type of changes in this release
```

3. Push the new git tag and the commit updating the version:

```
git push && git push --tags
```

The [build script](https://github.com/SmartBear/git-en-boite/blob/main/.github/workflows/ci.yml#L84) should take care of the rest.

# How to resolve "fatal: Not a git repository (or any of the parent directories): .git" issue

Remove the git-repos directory:

```
sudo rm -rf git-repos
```
