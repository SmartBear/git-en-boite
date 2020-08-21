import { GitFile } from '.'
import { ensure, isArray, JSONObject } from 'tiny-types'

export class Files extends Array<GitFile> {
  static fromJSON(json: unknown): Files {
    ensure('Files', json, isArray())
    const files = json as []

    return files.map((json: JSONObject) => GitFile.fromJSON(json))
  }
}
