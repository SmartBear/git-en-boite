/* tslint:disable: only-arrow-functions */

import { Given, When, Then, defineParameterType } from 'cucumber'
import { Actor } from '../support/screenplay'

const CreateUser = {
  withId: (userId : string)=> ({}) => { throw new Error('todo')}
}

const CreateApp = {
  named: (name: string)  => ({}) => { throw new Error('todo') }
}

const Has = {
  user: ({ userId }: { userId: string}) => { throw new Error('todo') }
}

Given('an app {app}', function (app: Actor) {
  const cucumber: Actor = new Actor('cucumber')
  cucumber.attemptsTo(CreateApp.named(Actor.name))
})

When('{app} creates a user {word}', function (app: Actor, userId: string) {
  app.attemptsTo(CreateUser.withId(userId))
})

Then('the {app} app\'s users should include {word}', function (userId: string, app: Actor) {
  app.checksThat(Has.user({ userId }))
})