# 3. Use typeorm with postgres

Date: 2020-03-27

## Status

Accepted

## Context

We need somewhere to store state, and we need a way to get data in / out of that store.

## Decision

Typeorm implements DataMapper, which is a low-coupled way to work with databases. It seems pretty mature and well-used. It's good enough for now.

## Consequences

A nice feature of Typeorm is that it will automatically migrate your database schema to match what's defined in your entities. This looks great for development but once we have production users we'll probably need to turn this off and move over to explicit migrations.

Typeorm encourages you to put database column definitions on "entity" classes. We need to make careful use of interfaces to prevent these details leaking where they shouldn't.
