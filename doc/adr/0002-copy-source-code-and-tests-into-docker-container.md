# 2. Copy source code and tests into Docker container

Date: 2020-03-19

## Status

Accepted

## Context

Previously the docker-compose.yaml file mapped a volume on the host to the `/app` directory on the container. This is great for a local development workflow, but it won't work in production.

## Decision

The decision I've made is to configure the Dockerfile to copy the source code (and tests) to the container. This means the container will have everything it needs to run the web server, and also to run tests.

## Consequences

The next step, now, is to run the tests on CI *inside* the Docker container.

Then we can add a step to CI to publish the image to Dockerhub.

There are two drawbacks:

* right now, you couldn't develop the app within Docker, because there's no mapped volume to your development machine. So you need to re-build the image each time you make a channge. I think we can fix this with another iteration on the docker-compose setup that over-rides the effect of the COPY. We'll see.
* we're shipping tests (i.e. the `features` directory) with the production app. This doesn't feel like a problem to me, and may even allow us to run some smoke tests post deployment. We'll see.
