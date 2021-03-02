export interface LogEvent {
  message: string
  level: 'info' | 'warn' | 'error' | 'fatal'
  [key: string]: unknown
}
