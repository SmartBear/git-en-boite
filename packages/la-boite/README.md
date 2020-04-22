## Setup

### Install dependencies

```
npm install
```

### Make a directory to store git repos

```
mkdir -p git-repos/development
```

## Run the app in development mode

```
export NODE_ENV=development
export GIT_EN_BOITE_PG_URL=postgres://postgres:postgres@localhost:5432/git-en-boite-development
./bin/start
```

## Run the tests

```
export GIT_EN_BOITE_PG_URL=postgres://postgres:postgres@localhost:5432/git-en-boite-development
./bin/test
```
