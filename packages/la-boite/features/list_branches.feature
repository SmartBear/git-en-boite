Feature: List branches

  @wip
  Scenario: One branch
    Given a GitHub repo "cucumber/shouty" with branches:
      | master |
    And a user Bob has valid credentials for the repo
    When Bob connects an app to the repo
    And the repo has synchronised
    Then Bob can see that the repo's branches are:
      | master |