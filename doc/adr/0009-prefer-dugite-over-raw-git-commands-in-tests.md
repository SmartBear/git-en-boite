# 9. Prefer dugite over raw git commands in tests

Date: 2020-05-26

## Status

Accepted

## Context

The build failed because the version of git used in CircleCI was not what we expected.

## Decision

Use `GitProcess.exec` even in tests that need to lean on the git process. 

## Consequences

This ensures we always get the same version of the git executable wherever we run the tests.
