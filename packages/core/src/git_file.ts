import { ensure, property, isString, JSONObject, isDefined } from 'tiny-types'

export class GitFile {
  static fromJSON(json: JSONObject): GitFile {
    ensure('GitFile', json, isDefined())
    ensure('GitFile', json, property('path', isString()))
    ensure('GitFile', json, property('content', isString()))
    return new GitFile(json.path as string, json.content as string)
  }
  constructor(public readonly path: string, public readonly content: string) {}
}
