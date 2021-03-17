import { After, Given, Then, When } from '@cucumber/cucumber'
import EventSource from 'eventsource'
import { DomainEvents, EventName, RepoId } from 'git-en-boite-core'
import { assertThat, equalTo, fulfilled, hasItem, hasProperty, promiseThat } from 'hamjest'

import { World } from '../support/world'

// TODO: move this to World
const closables: Array<{ close: () => void }> = []
When('a consumer is listening to the events on the repo', async function (this: World) {
  this.events = []
  const events = new EventSource(`http://localhost:8888/repos/${this.repoId}/events`)
  for (const eventName of DomainEvents.keys) {
    events.addEventListener(eventName, (event: Event) => {
      this.events.push(event.type)
    })
  }
  closables.push(events)
})

After(() => {
  for (const closable of closables) {
    closable.close()
  }
})

Given('a consumer is listening to the main event stream', function (this: World) {
  this.events = []
  const events = new EventSource(`http://localhost:8888/events`)
  for (const eventName of DomainEvents.keys) {
    events.addEventListener(eventName, (event: Event) => {
      this.events.push(event.type)
    })
  }
  closables.push(events)
})

Given('the repo has been fetched', async function (this: World) {
  await waitUntilRepoEvent('repo.fetched', this.repoId)(this)
})

When('the other repo has been fetched', async function (this: World) {
  await waitUntilRepoEvent('repo.fetched', this.anotherRepoId)(this)
})

Then('a {EventName} should have been emitted', async function (this: World, eventName: EventName) {
  assertThat(this.receivedDomainEvents, hasItem(hasProperty('type', eventName)))
})

Then('the repo should have been fetched', async function (this: World) {
  await promiseThat(
    new Promise<void>((received) =>
      this.domainEvents.on('repo.fetched', (event) => event.repoId.equals(this.repoId) && received())
    ),
    fulfilled()
  )
})

Then('the events received by the consumer should be:', function (this: World, expectedEvents: string) {
  assertThat(this.events, equalTo(expectedEvents.split('\n')))
})

const waitUntilRepoEvent = (eventKey: EventName, repoId: RepoId) => async (world: World) => {
  await promiseThat(
    new Promise<void>((received) =>
      world.domainEvents.on(eventKey, (event) => event.repoId.equals(repoId) && received())
    ),
    fulfilled()
  )
}
