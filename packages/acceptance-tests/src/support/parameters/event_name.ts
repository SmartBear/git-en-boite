import { defineParameterType } from '@cucumber/cucumber'
import { DomainEvents, EventName } from 'git-en-boite-core'

defineParameterType({
  name: 'EventName',
  regexp: new RegExp(`"(${DomainEvents.keys.join('|')})" event`),
  transformer: (value) => value as EventName,
})
