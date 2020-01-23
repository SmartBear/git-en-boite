import React from 'react'
import './App.css'
import { Tree, Button } from "@blueprintjs/core"

const generateTree = (paths) =>
  paths.map(({ id, attributes: { path } }) => ({ id, label: path, icon: "document" }))


function App() {
  const [files, setFiles] = React.useState([])
  React.useEffect(() => {
    (async function fetchAndSetFiles() {
      const response = await fetch('http://localhost:3001/files')
      const files = (await response.json()).data
      setFiles(files)
    })()
  })
  return (
    <div className="App">
      <header className="App-header">
        <select >
          {['master', 'sprint1', 'sprint2'].map((name) => <option>{name}</option>)}
        </select>
        <Tree contents={generateTree(files)}/>
      </header>
    </div>
  );
}

export default App;
