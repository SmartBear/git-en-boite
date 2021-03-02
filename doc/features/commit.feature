Feature: Commit

  Scenario: Add a new file
    Given a remote repo with branches:
      | main |
    And a consumer has connected the remote repo
    And the repo has been fetched
    When a consumer commits a new file to the "main" branch
    Then the file should be in the "main" branch of the remote repo

  Scenario: an empty commit
    Given a remote repo with branches:
      | main |
    And a consumer has connected the remote repo
    And the repo has been fetched
    When a consumer commits to the "main" branch with:
      | Author name | Author email      | Commit message          |
      | Emily       | emily@example.com | emily's crafted message |
    Then the remote repo should have a new commit at the head of the "main" branch:
      | Author name | Author email      | Commit message          |
      | Emily       | emily@example.com | emily's crafted message |

  Scenario: commit when the remote has moved forward
    Given a remote repo with branches:
      | main |
    And a consumer has connected the remote repo
    And the repo has been fetched
    And the remote has moved forward on the "main" branch
    When a consumer commits a new file to the "main" branch
    Then the file should be in the "main" branch of the remote repo
