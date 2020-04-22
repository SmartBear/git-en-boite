# 5. Use Redis and Bull for background tasks

Date: 2020-04-22

## Status

Accepted

## Context

When we do heavy lifting with git, like cloning repos, we can't do it during the user's HTTP request cycle. We need a way to put this work into the background.

## Decision

We're using the [bull](https://github.com/OptimalBits/bull/) library which uses Redis.

## Consequences

* Tests have got a little bit more complicated, as we need a synchonisation point to ensure these jobs have finished before doing assertions on the state in accpetance tests.
* Right now, we're assuming Redis runs on localhost. This means that devs need to run Redis locally. We'll need to set up configuration to enable us to specify the Redis connection.
* We may want to run jobs in a separate process. If so, things get a bit more complicated as those sripts need to be in javascript.
* Bull is moving to a [new API](https://github.com/taskforcesh/bullmq) which will mean changes for us at some point.
