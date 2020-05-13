# 7. Use yarn workspaces instead of lerna

Date: 2020-05-13

## Status

Accepted

## Context

Lerna was being a pain; not working as described in the docs. It seems a bit old and crufty, and was built before yarn workspaces were a thing.

## Decision

Switch to [yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces/). We may also use [mono](https://github.com/enzsft/mono) or [rush](https://rushjs.io) to add extra features for managing a monorepo.

## Consequences

We're switching back from npm to yarn for package management!
