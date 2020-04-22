## Setup

### Install dependencies

```
npm install
```

### Make a directory to receive git repos

```
mkdir git-repositories
```

## Run the development app

NODE_ENV=development GIT_EN_BOITE_PG_URL=postgres://postgres:postgres@localhost:5432/git-en-boite-development ./bin/start

## How to run the tests

GIT_EN_BOITE_PG_URL=postgres://postgres:postgres@localhost:5432/git-en-boite-test ./bin/test
