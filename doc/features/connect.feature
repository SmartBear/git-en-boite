Feature: Connect

  The first step to be able to work with a remote repository is to connect to it.

  You supply a Git HTTP URL and we take care of connecting it up.

  Scenario: Connection fails due to bad URL
    When a consumer tries to connect to the remote URL "a-bad-url"
    Then it should respond with an error:
      """
      'a-bad-url' does not appear to be a git repository
      Could not read from remote repository.

      Please make sure you have the correct access rights
      and the repository exists.

      """

  Scenario: Connection attempt using bad JSON
    When a consumer tries to connect using a malformed payload
    Then it should respond with an error:
      """
      payload should have required property 'repoId', payload should have required property 'remoteUrl'
      """
