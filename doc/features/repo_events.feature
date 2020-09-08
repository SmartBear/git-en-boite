Feature: Repo events

  You can listen to events from a Repo via HTTP Server Sent Events

  @wip
  Scenario: Listen to connect and fetch events
    Given a remote repo with commits on the "main" branch
    And a consumer is listening to the events on the repo
    When a consumer connects the remote repo
    And the repo has been fetched
    Then the events received by the consumer should be:
      """
      repo.connected
      repo.fetched
      """
