Feature: Repo events

  You can listen to events from a Repo via HTTP Server Sent Events

  @wip
  Scenario: Listen to connect and fetch events
    Given a remote repo with commits on the "main" branch
    And a consumer has connected the remote repo
    And the repo has been fetched
    When a consumer listens to the events on the repo
    And a consumer triggers a manual fetch of the repo
    Then the events received by the consumer should be:
      """
      repo.fetched
      """
