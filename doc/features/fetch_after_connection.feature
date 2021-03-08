Feature: Fetch automatically after connection

  After a repo is connected, we automatically run a fetch in the
  background.

  Scenario: Succesful fetch after a new connection
    Given a remote repo with commits on the "main" branch
    When a consumer connects the remote repo
    Then the repo should have been fetched

  Scenario: Error attempting manual fetch concurrent with automatic background fetch
    Given a remote repo with commits on the "main" branch
    When a consumer connects the remote repo
    And a consumer tries to fetch the repo
    Then it should respond with 503 status
    And it should respond with an error:
      """
      The local repo is currently in use by another process. Please try again in a moment.
      """
    And the consumer should be told to retry in 60 seconds
