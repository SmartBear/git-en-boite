import { Logger } from 'git-en-boite-core'
import { assertThat, containsString, equalTo } from 'hamjest'

import { createLogger } from './createLogger'

const verifyContract = (logger: Logger) => {
  it('logs to the console', () => {
    const lines = captureStdOut(() => {
      logger.info('this is a test')
    })
    assertThat(lines[0], containsString('this is a test'))
  })

  it('logs arbitrary data as JSON', () => {
    const lines = captureStdOut(() => {
      logger.info('test', { data: { one: { two: 3 } } })
    })
    assertThat(lines[0], containsString('{"one":{"two":3}}'))
  })

  describe('logging error objects', () => {
    it('logs the message', () => {
      const error = new Error('yikes')
      const lines = captureStdOut(() => {
        logger.error(error)
      })
      assertThat(lines[0], containsString('yikes'))
      console.log(lines[0])
    })

    xit('logs the stack trace', () => {
      const error = new Error('yikes')
      const lines = captureStdOut(() => {
        logger.error(error)
      })
      assertThat(lines[0], containsString('app/src/createLogger.spec.ts'))
    })
  })

  describe('removing sensitive fields', () => {
    it('sanitizes remoteUrl in the root of the metadata', () => {
      const lines = captureStdOut(() => {
        logger.info('test', { remoteUrl: 'https://token@github.com/org/project' })
      })
      assertThat(lines[0], containsString('https://***@github.com/org/project'))
    })

    it('sanitizes remoteUrl deep in the metadata', () => {
      const lines = captureStdOut(() => {
        logger.info('test', { data: { remoteUrl: 'https://token@github.com/org/project' } })
      })
      assertThat(lines[0], containsString('https://***@github.com/org/project'))
    })

    it('sanitizes token deep in the metadata', () => {
      const lines = captureStdOut(() => {
        logger.info('test', { data: { token: 'a-token' } })
      })
      assertThat(lines[0], containsString('"token":"***"'))
    })

    it('does not mutate the original value', () => {
      const meta = { data: { token: 'a-token' } }
      captureStdOut(() => {
        logger.info('test', meta)
      })
      assertThat(meta.data.token, equalTo('a-token'))
    })
  })
}

describe(createLogger.name, () => {
  context('in human-readable mode', () => {
    const logger = createLogger({ readableBy: 'human' })

    verifyContract(logger)
  })

  context('in machine-readable mode', () => {
    const logger = createLogger({ readableBy: 'machine' })

    verifyContract(logger)
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
