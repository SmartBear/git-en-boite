Feature: Read file

  You can read the contents of a file for a given git reference.

  This is effectively the same as running `git show <ref>:<path>`

  Scenario: Read a single file that exists
    Given a remote repo with a file commited to "main" branch
    And a consumer has connected the remote repo
    And the repo has been fetched
    Then the consumer can read the contents of the file on the "main" branch of the local clone
