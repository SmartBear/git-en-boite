Feature: Commit

  Scenario: Add a new file
    Given a remote repo with branches:
      | main |
    And the remote repo has been connected
    And the repo has been fetched
    When a consumer commits a new file to the 'main' branch
    Then the file should be in the 'main' branch of the remote repo

  Scenario: an empty commit
    Given a remote repo with branches:
      | main |
    And the remote repo has been connected
    And the repo has been fetched
    When a consumer commits to the 'main' branch with:
      | Author name | Author email      |
      | Emily       | emily@example.com |
    Then the remote repo should have a new commit at the head of the 'main' branch:
      | Author name | Author email      |
      | Emily       | emily@example.com |
