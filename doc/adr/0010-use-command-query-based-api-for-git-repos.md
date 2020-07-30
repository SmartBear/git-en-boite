# 10. use command/query-based API for git repos

Date: 2020-06-22

## Status

Accepted

## Context

Interacting with git repos involves many fine-grained operations, each of which is independent from the others - there's no shared state between them, other than what lives in the repo itself on disk. So they can be handled by independent functions rather than being modelled as methods on a class.

We anticipate that as the application grows, the number of these operations is likely to grow too. To maintain the open/closed, principle, we need a way to add new operations whithout modifying too much existing code.

It's also useful to be able to test each operation independently, since some of them will need quite involved test cases, and a single test of tests for one class would get pretty lengthy.

Finally, would be helpful to be able to compose fine-grained operations into higher-order ones, such as combining the operations of creating a branch, making a commit, and pushing to origin into a `PushCommit` operation.

## Decision

We've implemented a [command-bus](../../packages/command-bus) package which provides a typescript-friendly way to build a single `dispatch` function using a that takes different types of message object and dispatches the message to the appropriate handler function.

## Consequences

This has made the tests that need to set up git repos ([example](https://github.com/SmartBear/git-en-boite/blob/451fe3fe2dd0a03498ab72189c26bdfc78ecd527/packages/app/features/step_definitions/steps.ts#L14)) easy to read.

It may be possible to serialize / deserialize these messages, if we need to schedule some of these git operations as background tasks.

Mocking the interface to a repo may be more tricky, and it's possible we'll want to push this outside the core, and put a facade around it for the small set of operations the actual domain will want to do.

It's also possible that this pattern will confuse people. Although the client code is easy to read, the code that sets up a `dispatch` function ([example](https://github.com/SmartBear/git-en-boite/blob/451fe3fe2dd0a03498ab72189c26bdfc78ecd527/packages/local-git/src/bare_repo_factory.ts#L32)) is maybe not so nice for a newcomer.
