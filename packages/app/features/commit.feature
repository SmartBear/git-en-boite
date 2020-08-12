Feature: Commit

  Scenario: Add a new file
    Given a remote repo with branches:
      | main |
    And the remote repo has been connected
    And the repo has been fetched
    When a consumer commits a new file to the 'main' branch
    Then the file should be in the 'main' branch of the remote repo