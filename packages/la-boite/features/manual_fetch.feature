Feature: Manual Fetch

  If changes happen on the remote repo, we need to fetch those changes
  so that our clients can see them.

  For now, we're deliberately calling this "fetch" to match git's language,
  but we may wish to rename this to "sync" in future if we can make it work in
  both directions.

  Scenario: Manually fetch changes from upstream
    Given a remote repo with commits on the master branch
    And the repo has been connected
    When a new commit is made in the remote repo
    And a consumer triggers a manual fetch of the repo
    And the repo has synchronised
    Then the repo should have the new commit at the head of the master branch