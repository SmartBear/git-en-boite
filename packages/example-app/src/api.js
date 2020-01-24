const fetchApi = async (path, param) => {
  let url = `http://localhost:3001/${path}`
  if (param) {
    url = url.concat(`/${param}`)
  }
  const response = await fetch(url)
  return (await response.json()).data
}

const fetchFiles = (branch) => fetchApi('files', branch)
const fetchBranches = () => fetchApi('branches')

export {
  fetchFiles,
  fetchBranches
}
