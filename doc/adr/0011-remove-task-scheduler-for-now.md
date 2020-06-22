# 11. Remove task scheduler (for now)

Date: 2020-06-22

## Status

Accepted

## Context

The current design of task scheduler creates one queue per repo. We can't see how this can work with an out-of-process worker, since the worker needs to know in advance which queues to listen on, and the list of repos could change.

This design was primarily influenced by needing a way to synchonise the acceptance tests at the point where the jobs for a repo had all finished.

As we work to implement feedback when repo connections fail, this design was causing friction.

## Decision

Its simpler for the time being to remove the task scheduler, so repo connections and fetches will be immediately consistent, for the time being.

## Consequences

The upside is simplicity - it's one less moving part as we try to model the state transitions as we try to connect a repo.

The major downside is that a connect HTTP request to the service will currently not respond until the `git fetch` has completed, where previously it responded immediately, while the `fetch` happened in the background. We should not deploy until this is resolved, as it would have performance impacts on CucumberStudio, which makes these calls during a user request.
