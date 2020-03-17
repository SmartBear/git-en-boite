export const serializedListOfFiles = (files: Array<string>) => ({
  data: files.map((file, index) => ({
    type: 'file',
    id: index,
    attributes: {
      path: file
    }
  }))
})

export const serializedListOfBranches = (branches: Array<string>) => ({
  data: branches.map((branch: string, index : number) => ({
    type: 'branch',
    id: index,
    attributes: {
      name: branch
    }
  }))
})