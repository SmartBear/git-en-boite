const fetchApi = async (path) => {
  const response = await fetch(`http://localhost:3001/${path}`)
  return (await response.json()).data
}

const fetchFiles = () => fetchApi('files')
const fetchBranches = () => fetchApi('branches')

export {
  fetchFiles,
  fetchBranches
}
