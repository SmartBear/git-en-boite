# 13. Separate worker process and container

Date: 2020-07-31

## Status

Accepted

## Context

As described in [this ADR](./0012-background-git-operations.md) we are implementing a way to run some git
operations outside the main web server process.

## Decision

The background worker will be started as a separate process. You can start it using `yarn app start:worker`.

We've also configured a separate docker container in docker-compose to demonstrate how we can spin up multiple workers to support a single web server.

## Consequences

The performance of long-running git operations should now not impede the performance of the service overall, and we are ready to scale the number of worker containers as needed to support demand on the service.

The worker and server have to points of contact:

1) redis (via a BullMQ queue)
2) the `git-repos` folder (configured using the `GIT_ROOT` environment variable)

We're using a ping job when the server boots to check that there's at least one worker listening on the queue.

However, we have not made any checks to guarantee they're both looking at the same `git-repos` folder.
