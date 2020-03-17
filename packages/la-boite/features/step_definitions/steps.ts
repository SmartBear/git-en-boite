const { Given, When, Then, defineParameterType } = require('cucumber')
import { Actor } from '../support/screenplay'

const CreateUser = {
  withId: (userId : string)=> ({}) =>  {}
}

const Has = {
  user: ({ userId }: { userId: string}) => {}
}

Given('an app {app}', function (app: Actor) {
  // Write code here that turns the phrase above into concrete actions
  return 'pending'
})

When('{app} creates a user {word}', function (app: Actor, userId: string) {
  app.attemptsTo(CreateUser.withId(userId))
})

Then('the {app} app\'s users should include {word}', function (userId: string, app: Actor) {
  app.checksThat(Has.user({ userId }))
})