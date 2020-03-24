/* tslint:disable: only-arrow-functions */
import { ClientApp } from '../../src/entity/client_app'
import { createConnection } from 'typeorm'

import { Given, When, Then, defineParameterType } from 'cucumber'
import { Actor } from '../support/screenplay'

const CreateUser = {
  withId: (userId : string)=> ({}) => { throw new Error('todo')}
}

const CreateApp = {
  named: (name: string)  => ({ getRepository }) => {
    const repository = getRepository(ClientApp)
    const app = new ClientApp({ name })
    repository.save(app)
  }
}

const Has = {
  user: ({ userId }: { userId: string}) => { throw new Error('todo') }
}

Given('an app {app}', async function (app: Actor) {
  const connection = await createConnection({
    type: 'postgres',
    url: process.env['GIT_EN_BOITE_PG_URL'],
    entities: [
      ClientApp
    ]
  })
  const getRepository = connection.getRepository.bind(connection)
  const cucumber: Actor = new Actor({ name: 'cucumber', getRepository })
  await cucumber.attemptsTo(CreateApp.named(Actor.name))
})

When('{app} creates a user {word}', function (app: Actor, userId: string) {
  app.attemptsTo(CreateUser.withId(userId))
})

Then('the {app} app\'s users should include {word}', function (userId: string, app: Actor) {
  app.checksThat(Has.user({ userId }))
})