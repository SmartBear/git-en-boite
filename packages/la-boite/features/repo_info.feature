Feature: Repo info

  Once you've connected a repo, you can see information about it.

  @wip
  Scenario: List refs and branches
    Given a repo with branches:
      | master  |
      | develop |
    When Bob connects an app to the repo
    And the repo has synchronised
    Then Bob can see that the repo's refs are:
      | refs/heads/master           |
      | refs/heads/develop          |
      | refs/remotes/origin/master  |
      | refs/remotes/origin/develop |
    And Bob can see that the repo's branches are:
      | master  |
      | develop |