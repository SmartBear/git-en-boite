# 15. Remove Postgres (for now)

Date: 2021-04-14

## Status

Accepted

## Context

We're migrating to a new production environment and realised that although we configure postgres in our environments, we don't use it.

## Decision

Remove all dependencies on postgres from the code for now.

## Consequences

1. The infrastructure, code and docs tell the truth about the current needs of the system
2. There will be a little bit more work to use postgres for persistence later, as we'll have to set it up in our environments.

