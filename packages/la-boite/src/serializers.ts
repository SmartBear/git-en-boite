export const serializedListOfFiles = (files: string[]) => ({
  data: files.map((file, index) => ({
    type: 'file',
    id: index,
    attributes: {
      path: file
    }
  }))
})

export const serializedListOfBranches = (branches: string[]) => ({
  data: branches.map((branch: string, index : number) => ({
    type: 'branch',
    id: index,
    attributes: {
      name: branch
    }
  }))
})