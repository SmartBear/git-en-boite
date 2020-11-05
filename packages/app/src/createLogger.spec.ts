import { createLogger } from './createLogger'
import { assertThat, containsString, equalTo } from 'hamjest'

describe(createLogger.name, () => {
  it('logs to the console', () => {
    const logger = createLogger({ readableBy: 'human' })
    const lines = captureStdOut(() => {
      logger.info('test', { one: { two: 3 } })
    })
    assertThat(lines[0], containsString('test'))
  })
})

function captureStdOut(fn: () => void) {
  const lines: string[] = []
  const original = process.stdout.write
  process.stdout.write = (line: string) => !!lines.push(line)
  try {
    fn()
    return lines
  } catch (error) {
    throw error
  } finally {
    process.stdout.write = original
  }
}
