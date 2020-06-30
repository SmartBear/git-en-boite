# 12. Background git operations

Date: 2020-06-30

## Status

Accepted

## Context

Some git operations are expensive and slow, particularly fetching commits from a remote repo. We want to guarantee decent performance to all users, even in the event of heavy IO operations triggered by git operations. However, we would like to keep the interface to git simple and easy to work with. We would like to keep an immediately-consistent API. That means some methods might take several seconds - if not minutes for huge repos - to complete, but no polling or event interface will be needed on the consumer side of the adapter API (i.e. our domain model).

## Decision

We'll create an implementation of the `GitRepo` port that wraps the current adapter, delegating git operations to a separate worker via a task queue. We'll use [bullmq](https://github.com/taskforcesh/bullmq) for the task queue.

## Consequences

The [message-based interface to the `GitRepo` port](./0010-use-command-query-based-api-for-git-repos.md) is nice for using in tests, but gets in the way a bit when we want to use it from the core domain model. It would be more straightforward to have a regular interface with a method on it for each git operation.

We'll need to figure out how to start additional worker processes, perhaps doing this in a separate container in a production environment.

Assembling the app will get a bit more complex, building this chain of responsibility for handling git operations.
