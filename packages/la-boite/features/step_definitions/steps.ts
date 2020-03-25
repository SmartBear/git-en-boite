/* tslint:disable: only-arrow-functions */
import { ClientApp } from '../../src/entity/ClientApp'
import { createConnection, UpdateQueryBuilder, Connection, AdvancedConsoleLogger } from 'typeorm'

import { Given, When, Then, defineParameterType } from 'cucumber'
import { Actor } from '../support/screenplay'
import { Repository, Entity } from 'typeorm'
import { User } from '../../src/entity/User'
/* tslint:disable-next-line: no-var-requires */
const { assertThat, hasItem, hasProperty } = require('hamjest')

const CreateUser = {
  withId: (userId : string) => async ({ name, getRepository } : any) => {
    const repository: Repository<ClientApp> = await getRepository(ClientApp) as Repository<ClientApp>
    const user = new User()
    user.id = userId
    const app: ClientApp = await repository.findOneOrFail(name)
    app.users = app.users.concat([user])
    await repository.save(app)
  }
}

const CreateApp = {
  named: (name: string)  => async ({ getRepository } : { getRepository: any }) => {
    const repository = await getRepository(ClientApp)
    const app = new ClientApp()
    app.id = name
    await repository.save(app)
  }
}

const Has = {
  user: ({ userId }: { userId: string}) => { throw new Error('todo') }
}

const withConnection = async (fn: any) => {
  const connection = await createConnection({
    type: "postgres",
    url: process.env.GIT_EN_BOITE_PG_URL,
    entities: [ClientApp],
    synchronize: true
  })
  await fn(connection)
  await connection.close()
}

Given('an app {app}', async function (app: Actor) {
  await withConnection(async (connection: Connection) => {
    const getRepository = connection.getRepository.bind(connection)
    const cucumber: Actor = new Actor('cucumber').withAbilities({ getRepository })
    await cucumber.attemptsTo(CreateApp.named(app.name))
  })
})

When('{app} creates a user {word}', async function (app: Actor, userId: string) {
  await withConnection(async (connection: Connection) => {
    const getRepository = connection.getRepository.bind(connection)
    await app.withAbilities({ getRepository }).attemptsTo(CreateUser.withId(userId))
  })
})

Then('the {app} app\'s users should include {word}',
  async function (app:Actor, userId: string) {
  await withConnection(async (connection: Connection) => {
    const getRepository = connection.getRepository.bind(connection)
    const repository = await getRepository(ClientApp)
    const clientApp: ClientApp = await repository.findOneOrFail(app.name)
    assertThat(clientApp.users, hasItem(hasProperty('id', userId)))
  })
})