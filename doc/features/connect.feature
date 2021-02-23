Feature: Connect

  The first step to be able to work with a remote repository is to connect to it.

  You supply a Git HTTP URL and we take care of connecting it up.

  Scenario: Successful connection
    Given a remote repo with commits on the "main" branch
    When a consumer tries to connect to the remote repo
    Then it should respond with 200 status

  Scenario: Connection fails due to bad URL
    When a consumer tries to connect to the remote URL "a-bad-url"
    Then it should respond with an error:
      """
      Repository 'a-bad-url' not found.
      """

  Scenario: Connection attempt using bad JSON
    When a consumer tries to connect using a malformed payload
    Then it should respond with an error:
      """
      payload should have required property 'remoteUrl'
      """
