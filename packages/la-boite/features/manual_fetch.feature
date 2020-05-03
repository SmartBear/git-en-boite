Feature: Manual Fetch

  If changes happen on the remote repo, we need to fetch those changes
  so that our clients can see them.

  For now, we're deliberately calling this "fetch" to match git's language,
  but we may wish to rename this to "sync" in future if we can make it work in
  both directions.

  @wip
  Scenario: Manually fetch changes from upstream
    Given a remote repo with commits on the master branch
    And the repo has been connected
    When a new commit is made in the remote repo
    And the repo is fetched
    Then the repo should have the new commit at the head of the master branch