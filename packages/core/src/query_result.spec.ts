import { Responder, QueryResult } from './query_result'
import { stubInterface } from 'ts-sinon'
import assert from 'assert'
import { assertThat, is, truthy, falsy } from 'hamjest'

class Thing {}

describe('QueryResult', () => {
  context('With a null value', () => {
    it('#respond calls Responder#foundNone', async () => {
      const responder = stubInterface<Responder<Thing>>()
      const result = QueryResult.from<Thing>(null)
      await result.respond(responder)
      assert(responder.foundNone.called)
      assert(!responder.foundOne.called)
    })

    it('is not success', () => {
      const result = QueryResult.from<Thing>(null)
      assertThat(result.isSuccess, is(falsy()))
    })
  })

  context('With an undefined value', () => {
    it('calls Responder#foundNone', async () => {
      const responder = stubInterface<Responder<Thing>>()
      const result = QueryResult.from<Thing>(undefined)
      await result.respond(responder)
      assert(responder.foundNone.called)
      assert(!responder.foundOne.called)
    })

    it('is not success', () => {
      const result = QueryResult.from<Thing>(null)
      assertThat(result.isSuccess, is(falsy()))
    })
  })

  context('With a single value', () => {
    const thing = new Thing()
    const result = QueryResult.from<Thing>(thing)
    it('calls Responder#foundOne with the value', async () => {
      const responder = stubInterface<Responder<Thing>>()
      await result.respond(responder)
      assert(!responder.foundNone.called)
      assert(responder.foundOne.calledWith(thing))
    })
    it('is success', () => {
      assertThat(result.isSuccess, is(truthy()))
    })
  })

  context('With multiple values', () => {
    const things = [new Thing(), new Thing()]
    const result = QueryResult.from<Thing>(...things)

    it('calls Responder#foundMany with the values as an array', async () => {
      const responder = stubInterface<Responder<Thing>>()
      await result.respond(responder)
      assert(!responder.foundNone.called)
      assert(!responder.foundOne.called)
      assert(responder.foundMany.calledWith(things))
    })

    it('is success', () => {
      assertThat(result.isSuccess, is(truthy()))
    })
  })
})
