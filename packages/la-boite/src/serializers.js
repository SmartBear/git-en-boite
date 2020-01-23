const serializedListOfFiles = files => ({
  data: files.map((file, index) => ({
    type: 'file',
    id: index,
    attributes: {
      path: file
    }
  }))
})

const serializedListOfBranches = branches => ({
  data: branches.map((branch, index) => ({
    type: 'branch',
    id: index,
    attributes: {
      name: branch
    }
  }))
})

module.exports = { serializedListOfBranches, serializedListOfFiles }
