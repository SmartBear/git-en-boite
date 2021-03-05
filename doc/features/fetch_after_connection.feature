Feature: Fetch automatically after connection

  After a repo is connected, we automatically run a fetch in the
  background.

  Scenario: Succesful fetch after a new connection
    Given a remote repo with commits on the "main" branch
    When a consumer connects the remote repo
    Then the repo should have been fetched

  @wip
  Scenario: Succesful manual fetch concurrent with automatic background fetch
    Given a remote repo with commits on the "main" branch
    When a consumer connects the remote repo
    And a consumer tries to trigger a manual fetch of the repo
    Then the repo should have been fetched 2 times
