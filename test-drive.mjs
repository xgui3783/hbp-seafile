import dotenv from "dotenv"
import { Seafile } from "./Seafile.mjs"
import { Readable } from "stream"
import fs from "fs"

dotenv.config()

const accessToken = process.env.ACCESS_TOKEN
const seafileHandle = new Seafile({ accessToken })

const main = async () => {
  await seafileHandle.init()
  // const repo_id = await seafileHandle.getDefaultRepoId()
  // const allRepos = await seafileHandle.getRepos()
  // await seafileHandle.uploadFile({pathToFile: './data/vtk-spec.pdf'})
  // const r = await seafileHandle.ls()
  // console.log({ r })
  // await seafileHandle.mkdir({ dir: 'iav-v2' })

  // required for request form to parse properly, without throwing error
  // probably something to do with mimetype?
  // const readStream = new Readable()
  // readStream.path = 'test.md'

  // readStream.push('test success again and again\n')
  // readStream.push(null)
  // await seafileHandle.updateFile({ replaceFilepath: '/iav-v2/test.md', dir: '/iav-v2/' }, { readStream, filename: 'newmd.md' })

  // console.log(seafileHandle.token)
  // console.log(await seafileHandle.getDefaultRepoId())

  try{
    const dir = await seafileHandle.ls({ dir: '/interactive-atlas-viewer/' })
    console.log({ dir })
    const token = seafileHandle._token
    const newHandle = Seafile.from({ accessToken, token })
    const newDir = await newHandle.ls({ dir: '/interactive-atlas-viewer/' })
    console.log({ newDir })
  }catch(e){
    console.log('cauthg error')
    console.log(e)
  }

  console.log('everything is fine still?')
}



main()
