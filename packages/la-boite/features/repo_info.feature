Feature: Repo info

  Once you've connected a repo, you can see information about it.

  Scenario: List refs
    Given a repo with branches:
      | master  |
      | story-a |
    When Bob connects an app to the repo
    And the repo has synchronised
    Then Bob can see that the repo's refs are:
      | refs/heads/master  |
      | refs/heads/story-a |