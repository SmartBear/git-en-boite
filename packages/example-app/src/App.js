import React from 'react'
import { Tree, HTMLSelect } from "@blueprintjs/core"
import { fetchBranches, fetchFiles } from './api'

const generateTree = (paths) =>
  paths.map(({ id, attributes: { path } }) => ({ id, label: path, icon: "document" }))

function App() {
  const [files, setFiles] = React.useState([])
  const [branches, setBranches] = React.useState([])
  React.useEffect(() => {
    (async function () {
      setFiles(await fetchFiles())
    })()
  }, [])
  React.useEffect(() => {
    (async function () {
      setBranches(await fetchBranches())
    })()
  }, [])
  return (
    <div className="App">
      <header className="App-header">
        <HTMLSelect >
          {branches.map(({ id, attributes: { name } }) => <option key={id}>{name}</option>)}
        </HTMLSelect>
        <Tree contents={generateTree(files)} />
      </header>
    </div>
  );
}

export default App
