Feature: Create user

  This scenario is just here to prove that we can call postgres.

  It's probably not describing functionality we'll need in the end.

  Scenario: Create a valid user
    Given an app CucumberStudio
    When CucumberStudio creates a user Bob
    Then the CucumberStudio app's users should be:
      | Bob |