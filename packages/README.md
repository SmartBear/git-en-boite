The app uses a [ports-and-adapters/hexagonal architecture](<https://en.wikipedia.org/wiki/Hexagonal_architecture_(software)>) to break it up into managable chunks, keep control of dependencies, and allow us to test the core domain logic with fast tests that don't depend on infrastructure.

Here's a rough sketch of the architecture:

![diagram](../doc/adr/0008-hexagonal-architecture.jpg)

You can read more about it in [this ADR](../doc/adr/0008-hexagonal-architecture.md)
