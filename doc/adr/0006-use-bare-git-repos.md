# 6. Use bare git repos

Date: 2020-04-25

## Status

Proposed

## Context

When we create git repos we can either use `git init --bare` or we can clone them. A cloned repo has one main working tree with the git directory inside it. You can add additional worktrees. A bare repo does not have a default worktree, but we can still check out branches using the `git worktree` command.

## Decision

We should create a folder structure for each repo, something like

```
- git-repos
  - <hash of repo ID>
    - git # main bare git repo
    - branches # worktrees go under here
      - master # a worktree for the master branch
```

This folder structure will also allow us to store other data about the repo in files

## Consequences

Using bare repos allows us to re-use code from Jam, and it also looks like it will make things less confusing when we start committing files, since multiple clients can work on separate branches independently. It feels cleaner somehow than having a non-bare repo.

Once we start cloning people's repos it will be hard to change this decision, but not impossible.
