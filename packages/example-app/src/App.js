import React from 'react'
import { Alignment, Button, Card, Navbar, Tree, HTMLSelect } from "@blueprintjs/core"
import { fetchBranches, fetchFiles } from './api'
import './App.css'

const generateTree = (paths) =>
  paths.map(({ id, attributes: { path } }) => ({ id, label: path, icon: "document" }))

const prettyBranchName = (name) => name.split('/').slice(-1)[0]

const GitHubConnect = ({ setConnected }) =>
  <Card>
    <h5><a href="#">Connect your project</a></h5>
    <p>Connect your project to an existing GitHub repository.</p>
    <Button onClick={() => setConnected('connected')}>Connect to GitHub</Button>
  </Card>

function App() {
  const [connected, setConnected] = React.useState(localStorage.getItem('connectedToGitHub') || '')
  const [selectedBranch, setSelectedBranch] = React.useState([])
  const [files, setFiles] = React.useState([])
  const [branches, setBranches] = React.useState([])
  const handleRepositoryUpdate = async () => {
    setFiles(await fetchFiles())
    setBranches(await fetchBranches())
  }
  React.useEffect(() => {
    localStorage.setItem('connectedToGitHub', connected)
  }, [connected])
  React.useEffect(() => {
    (async function () {
      setFiles(await fetchFiles(selectedBranch))
    })()
  }, [selectedBranch])
  React.useEffect(() => {
    (async function () {
      setBranches(await fetchBranches())
    })()
  }, [])
  React.useEffect(() => {
    const es = new EventSource('http://localhost:3001/sse')
    es.addEventListener('repository-updated', handleRepositoryUpdate)
    return () => es.removeEventListener('repository-updated', handleRepositoryUpdate)
  }, [])
  return (
    <div className="App">
      <h1>Git en boîte demo</h1>
      {!connected ? <GitHubConnect setConnected={setConnected} /> :
        <header className="App-header">
          <Navbar>
            <Navbar.Group align={Alignment.LEFT}>
              <Navbar.Heading>smartbear/git-en-boite-demo</Navbar.Heading>
              <Navbar.Divider />
              <HTMLSelect defaultValue='master' onChange={(event) => setSelectedBranch(event.currentTarget.value)}>
                {branches.map(({ id, attributes: { name } }) => <option key={id}>{prettyBranchName(name)}</option>)}
              </HTMLSelect>
            </Navbar.Group>
          </Navbar>
          <Tree contents={generateTree(files)} />
        </header>}
    </div>
  )
}

export default App
