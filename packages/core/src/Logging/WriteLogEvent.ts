import { LogEvent } from './LogEvent'

export type WriteLogEvent = (event: LogEvent | Error) => void
