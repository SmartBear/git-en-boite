import React from 'react'
import { Alignment, Navbar, Tree, HTMLSelect } from "@blueprintjs/core"
import { fetchBranches, fetchFiles } from './api'

const generateTree = (paths) =>
  paths.map(({ id, attributes: { path } }) => ({ id, label: path, icon: "document" }))

const prettyBranchName = (name) => name.split('/').slice(-1)[0]

function App() {
  const [selectedBranch, setSelectedBranch] = React.useState([])
  const [files, setFiles] = React.useState([])
  const [branches, setBranches] = React.useState([])
  const handleRepositoryUpdate = async () => {
    setFiles(await fetchFiles())
    setBranches(await fetchBranches())
  }
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
    es.onopen = () => { console.log('hello') }
    es.onmessage = (x) => { handleRepositoryUpdate() }
    es.addEventListener('repository-updated', handleRepositoryUpdate)
    return () => es.removeEventListener('repository-updated', handleRepositoryUpdate)
  }, [])
  return (
    <div className="App">
      <header className="App-header">
        <Navbar>
          <Navbar.Group align={Alignment.LEFT}>
            <Navbar.Heading>Select a branch</Navbar.Heading>
            <Navbar.Divider />
            <HTMLSelect defaultValue='master' onChange={(event) => setSelectedBranch(event.currentTarget.value)}>
              {branches.map(({ id, attributes: { name } }) => <option key={id}>{prettyBranchName(name)}</option>)}
            </HTMLSelect>
          </Navbar.Group>
        </Navbar>
        <Tree contents={generateTree(files)} />
      </header>
    </div>
  );
}

export default App
