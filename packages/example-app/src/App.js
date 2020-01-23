import React from 'react'
import './App.css'
import { Tree, Button, HTMLSelect } from "@blueprintjs/core"

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
        <HTMLSelect >
          {['master', 'sprint1', 'sprint2'].map((name, index) => <option key={index}>{name}</option>)}
        </HTMLSelect>
        <Tree contents={generateTree(files)}/>
      </header>
    </div>
  );
}

export default App;
