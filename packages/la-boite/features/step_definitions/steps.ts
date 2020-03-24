/* tslint:disable: only-arrow-functions */
import { ClientApp } from '../../src/entity/ClientApp'
import { createConnection, UpdateQueryBuilder } from 'typeorm'
import { v4 as uuid } from 'uuid'

import { Given, When, Then, defineParameterType } from 'cucumber'
import { Actor } from '../support/screenplay'
import { Repository, Entity } from 'typeorm'

const CreateUser = {
  withId: (userId : string)=> ({}) => { throw new Error('todo')}
}

const CreateApp = {
  named: (name: string)  => async ({ getRepository } : { getRepository: any }) => {
    const repository = await getRepository(ClientApp)
    const app = new ClientApp()
    app.name = name
    app.id = uuid()
    await repository.save(app)
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

When('{app} creates a user {word}', async function (app: Actor, userId: string) {
  await app.attemptsTo(CreateUser.withId(userId))
})

Then('the {app} app\'s users should include {word}', async function (userId: string, app: Actor) {
  await app.checksThat(Has.user({ userId }))
})