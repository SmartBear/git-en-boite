Feature: Manual Fetch

  If changes happen on the remote repo, we need to fetch those changes
  so that our clients can see them.

  The intention is that this will happen automatically, via a webhook that
  git-en-boite sets up on [connection](./connect.feature) but for now
  we allow the client to do this manually.

  Scenario: Manually fetch changes from upstream
    Given a remote repo with commits on the master branch
    And the remote repo has been connected
    When a new commit is made in the remote repo
    And a consumer triggers a manual fetch of the repo
    And the fetch has finished
    Then the repo should have the new commit at the head of the master branch