export interface Responder<ResultType> {
  foundMany: (results: ResultType[]) => Promise<void>
  foundOne: (result: ResultType) => Promise<void>
  foundNone: () => Promise<void>
}

export class QueryResult<ResultType> {
  readonly results: ResultType[]
  constructor(...results: ResultType[]) {
    this.results = results.filter(result => !!result)
  }
  async respond(responder: Responder<ResultType>) {
    if (this.results.length > 1) return responder.foundMany(this.results)
    if (this.results.length === 1) return responder.foundOne(this.results[0])
    if (this.results.length === 0) return responder.foundNone()
  }
}
