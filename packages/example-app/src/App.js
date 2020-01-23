import React from 'react'
import logo from './logo.svg'
import './App.css'
import { Tree } from "@blueprintjs/core"

function listFiles() {
  return [
    "one.js", "two.js", "a-folder/three.js"
  ]
}



function generateTree(paths) {
  return paths.map((path, index) => ({ id: index, label: path, icon: "document" }))
  // return [
  //           { id: "1", label: "one.js", icon: "document" },
  //           { id: "2", label: "two.js", icon: "document" },
  //           { id: "3", label: "a-folder", icon: "folder-open", isExpanded: true, childNodes: [
  //             { id: "4", label: "three.js", icon: "document"}
  //           ]}
  //         ]
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Tree contents={generateTree(listFiles())}></Tree>
      </header>
    </div>
  );
}

export default App;
