require('dotenv').config()

const { Seafile } = require('./Seafile')
const { Readable } = require('stream')
const fs = require('fs')
const seafileHandle = new Seafile({ accessToken: process.env.ACCESS_TOKEN })

const main = async () => {
  await seafileHandle.init()
  // const repo_id = await seafileHandle.getDefaultRepoId()
  // const allRepos = await seafileHandle.getRepos()
  // await seafileHandle.uploadFile({pathToFile: './data/vtk-spec.pdf'})
  // const r = await seafileHandle.ls({ dir: 'iav' })
  // console.log({ r })
  // await seafileHandle.mkdir({ dir: 'iav-v2' })

  // required for request form to parse properly, without throwing error
  // probably something to do with mimetype?
  const readStream = new Readable()
  readStream.path = 'test.md'

  readStream.push('test success again and again\n')
  readStream.push(null)
  await seafileHandle.updateFile({ replaceFilepath: '/iav-v2/test.md', dir: '/iav-v2/' }, { readStream, filename: 'newmd.md' })

  // console.log(seafileHandle.token)
  // console.log(await seafileHandle.getDefaultRepoId())
}

main()
