import { Responder, QueryResult } from './query_result'
import { stubInterface } from 'ts-sinon'
import assert from 'assert'

class Thing {}

describe('QueryResult#respond', () => {
  context('With a null value', () => {
    it('calls Responder#foundNone', async () => {
      const responder = stubInterface<Responder<Thing>>()
      const result = new QueryResult<Thing>(null)
      await result.respond(responder)
      assert(responder.foundNone.called)
      assert(!responder.foundOne.called)
    })
  })

  context('With an undefined value', () => {
    it('calls Responder#foundNone', async () => {
      const responder = stubInterface<Responder<Thing>>()
      const result = new QueryResult<Thing>(undefined)
      await result.respond(responder)
      assert(responder.foundNone.called)
      assert(!responder.foundOne.called)
    })
  })

  context('With a single value', () => {
    it('calls Responder#foundOne with the value', async () => {
      const responder = stubInterface<Responder<Thing>>()
      const thing = new Thing()
      const result = new QueryResult<Thing>(thing)
      await result.respond(responder)
      assert(!responder.foundNone.called)
      assert(responder.foundOne.calledWith(thing))
    })
  })

  context('With multiple values', () => {
    it('calls Responder#foundMany with the values as an array', async () => {
      const responder = stubInterface<Responder<Thing>>()
      const things = [new Thing(), new Thing()]
      const result = new QueryResult<Thing>(...things)
      await result.respond(responder)
      assert(!responder.foundNone.called)
      assert(!responder.foundOne.called)
      assert(responder.foundMany.calledWith(things))
    })
  })
})
