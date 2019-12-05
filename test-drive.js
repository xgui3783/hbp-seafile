require('dotenv').config()

const { Seafile } = require('./Seafile')

const seafileHandle = new Seafile({ accessToken: process.env.ACCESS_TOKEN })

const main = async () => {
  await seafileHandle.init()
  const repo_id = await seafileHandle.getDefaultRepoId()
  const allRepos = await seafileHandle.getRepos()
  // await seafileHandle.uploadFile({pathToFile: './data/vtk-spec.pdf'})
  const r = await seafileHandle.ls({ dir: 'iav' })
  console.log({ r })
  await seafileHandle.mkdir({ dir: 'iav-v2/bla' })
}

main()
