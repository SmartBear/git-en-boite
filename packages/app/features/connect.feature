Feature: Connect

  The first step to be able to work with a remote repository is to connect to it.

  You supply a Git HTTP URL and we take care of connecting it up.

  Depending on the size of your repo, this may take some time.

  Scenario: Connection fails due to bad URL
    When a consumer tries to connect to the remote URL "a-bad-url"
    Then it should respond with an error:
      """
      {
        "error": "Could not connect to a Git HTTP server using remoteUrl 'a-bad-url'"
      }
      """

  Scenario: Connection attempt using bad JSON
    When a consumer tries to connect using a malformed payload
    Then it should respond with an error:
      """
      {
        "error": "Missing information from the request: repoId, remoteUrl"
      }
      """