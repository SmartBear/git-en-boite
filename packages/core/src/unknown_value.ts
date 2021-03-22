import { TinyType } from 'tiny-types'

export class UnknownValue extends TinyType {
  get value(): void {
    throw new Error('This is an unknown value')
  }

  equals(): boolean {
    return false
  }
}
