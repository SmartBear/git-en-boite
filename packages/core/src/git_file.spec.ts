import { GitFile, FilePath, FileContent } from '.'
import { assertThat, equalTo, throws, hasProperty, containsString } from 'hamjest'

describe(GitFile.name, () => {
  describe('creates from json', () => {
    it('works for serialized file', () => {
      const path = 'file.path'
      const content = 'file content'
      const file = GitFile.fromJSON({ path, content })
      assertThat(file, equalTo(new GitFile(new FilePath(path), new FileContent(content))))
    })

    it('throws when file does not include path', () => {
      const content = 'file content'
      assertThat(
        () => GitFile.fromJSON({ content }),
        throws(hasProperty('message', containsString('should have a property "path"')))
      )
    })

    it('throws when file does not include content', () => {
      const path = 'file content'
      assertThat(
        () => GitFile.fromJSON({ path }),
        throws(hasProperty('message', containsString('should have a property "content"')))
      )
    })

    it('throws when file does not include content', () => {
      assertThat(() => GitFile.fromJSON(undefined), throws(hasProperty('message', containsString('should be defined'))))
    })
  })
})
