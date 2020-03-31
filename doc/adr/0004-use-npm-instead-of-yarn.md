# 4. Use npm instead of yarn

Date: 2020-03-31

## Status

Accepted

## Context

We're getting security vulnerabilty warnings from GitHub due to transitive dependencies. Npm offers a `--depth` setting for updating dependencies that yarn doesn't seem to have. Which raises the question: why use yarn?

## Decision

Switch to npm.

## Consequences

We should be able to fix the transitive dependencies problem more easily. I think installations will be marginally slower but no big deal.

