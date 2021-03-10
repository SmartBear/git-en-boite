Feature: Events

  You can listen to events about via HTTP Server Sent Events.

  Events include:

  - repo.connected
  - repo.fetched
  - repo.fetch-failed

  Scenario: Listen to events from a repo
    Given a remote repo with commits on the "main" branch
    And a consumer is listening to the events on the repo
    When a consumer connects the remote repo
    And the repo has been fetched
    Then the events received by the consumer should be:
      """
      repo.connected
      repo.fetched
      """

  Scenario: Listen to events across all repos
    Given a consumer is listening to the main event stream
    When a consumer connects to a remote repo
    And the repo has been fetched
    And a consumer connects to another remote repo
    And the other repo has been fetched
    Then the events received by the consumer should be:
      """
      repo.connected
      repo.fetched
      repo.connected
      repo.fetched
      """
