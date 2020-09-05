Feature: Fetch after connection

  After a repo is connected, we automatically run a fetch in the
  background.

  Scenario: Succesful fetch after a new connection
    Given a remote repo with commits on the "main" branch
    When a consumer connects the remote repo
    Then the repo should be fetched