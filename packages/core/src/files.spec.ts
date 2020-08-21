import { Files } from '.'
import { assertThat, equalTo, throws, hasProperty, matchesPattern } from 'hamjest'
import { GitFile, FilePath, FileContent } from './git_file'

describe(Files.name, () => {
  describe('create from json', () => {
    it('works for an array of serialized files', () => {
      const path = 'a.path'
      const content = 'content'
      const files = Files.fromJSON([{ path, content }])
      assertThat(files, equalTo([new GitFile(new FilePath(path), new FileContent(content))]))
    })

    it('fails when the value is not an array', () => {
      assertThat(
        () => Files.fromJSON('not an array'),
        throws(hasProperty('message', matchesPattern('should be an array'))),
      )
    })

    it('fails when the array contains anything other than serialized GitFile', () => {
      assertThat(() => Files.fromJSON(['not a file']), throws())
    })
  })
})
