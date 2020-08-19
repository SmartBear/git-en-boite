import { AsyncQuery, Handle } from 'git-en-boite-message-dispatch'
import { File } from 'git-en-boite-core'
import { GetFiles } from '../operations'
import { GitDirectory } from '../git_directory'
import { GitProcess } from 'dugite'
import { Readable, PassThrough } from 'stream'
import Split from 'stream-split'

const streamToArray = (readableStream: Readable) => {
  return new Promise((resolve, reject) => {
    const items: any[] = []
    readableStream.on('data', items.push.bind(items))
    readableStream.on('error', reject)
    readableStream.on('end', () => resolve(items))
  })
}

export const handleGetFiles: Handle<GitDirectory, AsyncQuery<GetFiles, File[]>> = async (
  repo,
  { branchName },
) => {
  const result = new PassThrough({ objectMode: true })
  const splitter = new Split(new Buffer('\u0000'))

  // -r makes ls-tree recurse
  // -z prevents octal-escaped quoted paths and separates entries with NUL byte (\u0000)
  const ls = GitProcess.spawn(['ls-tree', '--full-tree', '-r', '-z', branchName.value], repo.path)
  const stream = ls.stdout.pipe(splitter)

  let rsclosed = false
  let lscode: number = null
  let lssignal: string = null

  const error = new Error(
    `Failed to list files for ${branchName}. Repo path: ${repo.path}. Status: ${lscode}. Signal: ${lssignal}`,
  )

  const endOrError = () => {
    if (!rsclosed) return
    if (lscode === null && lssignal === null) return
    if (lscode === 0) result.end()
    else {
      console.error(error)
      result.end()
    }
  }

  ls.on('close', (code, signal) => {
    lscode = code
    lssignal = signal
    endOrError()
  })
  ls.on('error', err => result.emit('error', err))

  stream.on('data', (data: any) => {
    const line = data.toString()
    const [, , entryType, gitBlobSha, path] = line.match(/^(\d+) ([a-z]+) ([a-f0-9]+)\t(.+)$/)
    if (entryType !== 'blob') return
    result.write(
      repo.exec('show', [gitBlobSha]).then(content => ({
        path: path,
        content: content.stdout,
      })),
    )
  })

  stream.on('end', () => {
    rsclosed = true
    endOrError()
  })

  const gettingFiles = (await streamToArray(result)) as Promise<File>[]
  return Promise.all(gettingFiles)
}
