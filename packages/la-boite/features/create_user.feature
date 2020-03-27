Feature: Create user

  Most operations in git-en-boite are performed on behalf of a user.

  So the first step is to create a user.

  Scenario: Create a valid user
    Given an app CucumberStudio
    When CucumberStudio creates a user Bob
    Then the CucumberStudio app's users should be:
      | Bob |