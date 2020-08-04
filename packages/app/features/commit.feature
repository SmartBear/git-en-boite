Feature: Commit

  @wip
  Scenario: Add a new file
    Given a remote repo with branches:
      | main |
    And the remote repo has been connected
    When a consumer commits a new file to the 'main' branch
    Then the file should be in the 'main' branch of the remote repo