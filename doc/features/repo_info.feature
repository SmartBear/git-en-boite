Feature: Repo info

  Once you've connected a repo, you can see information about it.

  Scenario: List refs and branches
    Given a remote repo with branches:
      | master  |
      | develop |
    And a consumer has connected the remote repo
    When the repo has been fetched
    Then the repo's branches should be:
      | master  |
      | develop |

  @wip
  Scenario: Failed to connect
    Given a consumer has failed to connect to a remote repo
    When the consumer tries to get the repo's info
    Then it should respond with 404 status
