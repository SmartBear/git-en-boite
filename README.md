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

We use [Lerna](https://lerna.js.org) to manage the dependencies between those packages.

## Sample app

One of the packages is a sample app. Try out the sample app to get a feel for
what git-en-boite can do for you.

### Start the application

The following docker-compose command starts the backend HTTP API for git and our
example app:

```bash
docker-compose up
```

## Development

- Install yarn

Then, run the servers (frontend and backend):

```
NODE_ENV=development npx lerna run start
```
