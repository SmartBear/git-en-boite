Feature: List branches

  Once you've connected a repo, you can see information about it.

  Scenario: One branch
    Given a repo with branches:
      | master |
    When Bob connects an app to the repo
    And the repo has synchronised
    Then Bob can see that the repo's branches are:
      | master |