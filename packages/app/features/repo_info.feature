Feature: Repo info

  Once you've connected a repo, you can see information about it.

  Scenario: List refs and branches
    Given a remote repo with branches:
      | master  |
      | develop |
    And the remote repo has been connected
    When a consumer triggers a manual fetch of the repo
    And the fetch has finished
    Then the repo's refs should be:
      | refs/remotes/origin/master  |
      | refs/remotes/origin/develop |
    And the repo's branches should be:
      | master  |
      | develop |