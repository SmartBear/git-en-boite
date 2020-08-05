export interface Responder<ResultType> {
  foundMany?: (results: ResultType[]) => Promise<void> | void
  foundOne?: (result: ResultType) => Promise<void> | void
  foundNone?: () => Promise<void> | void
}

export abstract class QueryResult<ResultType> {
  abstract isSuccess: boolean
  abstract respond(responder: Responder<ResultType>): unknown

  static from<ResultType>(...results: ResultType[]): FailureResult<ResultType> {
    const cleanResults = results.filter(result => !!result)
    if (cleanResults.length === 1) return new SingleSuccessResult<ResultType>(cleanResults[0])
    if (cleanResults.length > 1) return new ManySuccessResult<ResultType>(...cleanResults)
    return new FailureResult<ResultType>()
  }
}

class FailureResult<ResultType> {
  get isSuccess() {
    return false
  }

  async respond(responder: Responder<ResultType>) {
    return responder.foundNone()
  }
}

class SingleSuccessResult<ResultType> extends QueryResult<ResultType> {
  private readonly result: ResultType

  constructor(result: ResultType) {
    super()
    this.result = result
  }

  get isSuccess() {
    return true
  }

  async respond(responder: Responder<ResultType>) {
    return responder.foundOne(this.result)
  }
}

class ManySuccessResult<ResultType> extends QueryResult<ResultType> {
  private readonly results: ResultType[]

  constructor(...results: ResultType[]) {
    super()
    this.results = results
  }

  get isSuccess() {
    return true
  }

  async respond(responder: Responder<ResultType>) {
    return responder.foundMany(this.results)
  }
}
