import { ensure, property, isString, JSONObject, isDefined, TinyTypeOf } from 'tiny-types'

export class FilePath extends TinyTypeOf<string>() {
  toString(): string {
    return this.value
  }
}

export class FileContent extends TinyTypeOf<string>() {
  get isKnown(): boolean {
    return true
  }
}
export class UnknownFileContent extends TinyTypeOf<string>() {
  get isKnown(): boolean {
    return false
  }
}

export class GitFile {
  static fromJSON(json: JSONObject): GitFile {
    ensure('GitFile', json, isDefined())
    ensure('GitFile', json, property('path', isString()))
    ensure('GitFile', json, property('content', isString()))
    return new GitFile(new FilePath(json.path as string), new FileContent(json.content as string))
  }
  constructor(public readonly path: FilePath, public readonly content: FileContent) {}
}
