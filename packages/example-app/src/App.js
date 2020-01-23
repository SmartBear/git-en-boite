import React from 'react'
import './App.css'
import { Tree, HTMLSelect } from "@blueprintjs/core"

const generateTree = (paths) =>
  paths.map(({ id, attributes: { path } }) => ({ id, label: path, icon: "document" }))

const fetchFiles = async () => {
  const response = await fetch('http://localhost:3001/files')
  return (await response.json()).data
}

function App() {
  const [files, setFiles] = React.useState([])
  const [branches, setBranches] = React.useState([])
  React.useEffect(() => {
    (async function () {
      setFiles(await fetchFiles())
    })()
  })
  React.useEffect(() => {
    (async function fetchAndSetBranches() {
      const response = await fetch('http://localhost:3001/branches')
      const branches = (await response.json()).data
      setBranches(branches)
    })()
  })
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
