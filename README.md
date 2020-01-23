# git-aux-boite

An experiment to put git in a box to make it easy to work with in your apps.

## Features

* Clone repos from 3rd party git providers (GitHub, GitLab etc) and set up webhooks to stay in sync when that remote is updated
* Emits events about changes in the repo
* Query the repo for branches, file lists, file contents, etc.
* Create new commits locally on a branch
* Create pull requests on 3rd party providers from a local branch

## Architecture

git aux boite is written in Node-JS, but runs in a docker container. It exposes an HTTP API.

## Sample app

Try out the sample app to get a feel for what git-aux-boite can do for you.
