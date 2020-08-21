# 14. Always use value objects in the core

Date: 2020-08-21

## Status

Accepted

## Context

We've historically used primitives for things like, say, a RepoId. We've also sometimes used interfaces, exported by the core package, to represent the shape of some values being passed in.

We've found that using primitives doesn't make the most of Typescript, and also makes the code less expressive. Value Objects attract behaviour, and where we've used a value object, we've been able to [move functions onto it](https://github.com/SmartBear/git-en-boite/commit/45535197ddfec39539d2c2cff906dd354750cbce).

Where we've mixed interfaces and full-blown objects to represent values, we've found the interfaces confusing. It's better to standardise on one or the other.

## Decision

As of [#164](https://github.com/SmartBear/git-en-boite/issues/164), all type passed into the interfaces of the core package are [value objects](https://www.martinfowler.com/bliki/ValueObject.html)

We'll keep using interfaces to represent API surfaces that might have polymorphic implementations, but we'll use value object classes, exported by the core package, to represent values.

This holds true even for single attributes like a commit author's [name](https://github.com/SmartBear/git-en-boite/blob/639b40ab3bb3dd1668e4efc6803bc9779ffb1801/packages/core/src/author.ts#L9).

## Consequences

There's a little bit more hassle setting up test data. We may want to look at reviving [tdb](https://github.com/mattwynne/tdb/) or something similar.
