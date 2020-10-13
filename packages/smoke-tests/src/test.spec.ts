import { assertThat, equalTo } from 'hamjest'
import fetch from 'node-fetch'
import { v4 as uuid } from 'uuid'

describe('smoke test', () => {
  let url = `http://localhost:3001`
  let repo_id=`smoke-test-${uuid()}`
  let remote_url='https://github.com/smartbear/git-en-boite-demo.git'

  it(`Checks if the server is up: ${url}`, async () => {
    const response = await fetch(url)
    assertThat(response.status, equalTo(200))
  })

  it('Creates a repo', async() => {
    const params = {'repoId': repo_id, 'remoteUrl': remote_url};
    const response = await fetch(`${url}/repos`,
      {
        method: 'POST',
        body: JSON.stringify(params),
        headers: {'Content-Type':'application/json'}
      }
    )
    assertThat(response.status, equalTo(202))
  })

  it('Waits for repo to be fetched', async() => {
    const response = await fetch(`${url}/repos/${repo_id}/events?until=repo.fetched`)
    assertThat(response.status, equalTo(200))
  })

  it('Gets repo branches details', async() => {
    const response = await fetch(`${url}/repos/${repo_id}`)
    assertThat((await response.json()).branches, equalTo([]))
  })
})
