import { createLogger } from './createLogger'
import { assertThat, containsString, equalTo } from 'hamjest'

describe(createLogger.name, () => {
  const logger = createLogger({ readableBy: 'human' })

  it('logs to the console', () => {
    const lines = captureStdOut(() => {
      logger.info('test', { one: { two: 3 } })
    })
    assertThat(lines[0], containsString('test'))
  })

  describe('removing sensitive fields', () => {
    it('sanitizes remoteUrl in the root of the metadata', () => {
      const lines = captureStdOut(() => {
        logger.info('test', { remoteUrl: 'https://token@github.com/org/project' })
      })
      assertThat(lines[0], containsString('https://***@github.com/org/project'))
    })
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
