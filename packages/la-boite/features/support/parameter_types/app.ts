import { defineParameterType } from 'cucumber'
import { Actor } from '../screenplay'

defineParameterType({
  name: 'app',
  regexp: /[A-Z][a-z]+(?:[A-Z][a-z]+)*/,
  transformer: (name: string) => new Actor(name)
})