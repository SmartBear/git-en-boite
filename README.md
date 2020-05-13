[![Test & Deploy](https://circleci.com/gh/SmartBear/git-en-boite/tree/master.svg?style=shield)](https://app.circleci.com/pipelines/github/SmartBear/git-en-boite)

# git-en-boite

An experiment to put git in a box to make it easy to work with in your apps.

## Features

- Clone repos from 3rd party git providers (GitHub, GitLab etc) and set up webhooks to stay in sync when that remote is updated
- Emits events about changes in the repo
- Query the repo for branches, file lists, file contents, etc.
- Create new commits locally on a branch
- Create pull requests on 3rd party providers from a local branch

## Architecture

git-en-boite is written in Node-JS, but runs in a docker container. It exposes an HTTP API.

It is separated into multiple Node packages which are all contained inside this Git repo.

### Start the application

The following docker-compose command starts the backend HTTP API

```bash
docker-compose up
curl http://localhost:3001
```

## Development

Install yarn, then install dependencies:

```
yarn
```

Run the tests in the main package:

```
cd packages/la-boite
yarn test
```
