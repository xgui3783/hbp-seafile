# HBP Seafile

A small wrapper around HBP Seafile API for NodeJS.

# Installation

```bash
npm i -s hbp-seafile
```

# Usage

```javascript
import { Seafile } from "hbp-seafile"
const ACCESS_TOKEN = process.env.ACCESS_TOKEN

// hbp-seafile reads this env var as endpoint to query drive apis
// if unset: https://drive.ebrains.eu/api2
console.log(process.env.HBP_SEAFILE_API_ENDPOINT)

/**
 * nb
 * - accessToken must have collab.drive scope
 * - accessToken must have issuer as iam.ebrains.eu (for drive.ebrains.eu/api2 endpoint)
*/
const main = async () => {

  const seafileHandle = new Seafile({ accessToken: ACCESS_TOKEN })
  
  // init 
  await seafileHandle.init()

  // default repo id
  const repo_id = await seafileHandle.getDefaultRepoId()

  // all repo
  const allRepos = await seafileHandle.getRepos()

  // upload file in default repo at root dir
  await seafileHandle.uploadFile({pathToFile: 'path/to/file.pdf'})
  
  // check content of dir called iav in default repo
  const r = await seafileHandle.ls({ dir: 'iav' })

  // check content of dir called iav in repo with id TEST_ID
  const r = await seafileHandle.ls({ repo_id: 'TEST_ID', dir: 'iav' })
  
  // make dir (nested dir needs to be made iteratively)
  await seafileHandle.mkdir({ dir: 'iav-v2' })

  // upload file test.txt in repo with id TEST_ID under folder /iav (assuming folder exists)
  await seafileHandle.uploadFile({ pathToFile: '/iav/test.txt' }, { repoId: 'TEST_ID', dir: '/iav' })

  // update the just uploaded file using an readable stream
  const readStream = new Readable()
  // required for request form to parse properly, without throwing error
  // probably something to do with mimetype?
  readStream.path = 'test.txt'
  readStream.push('test success again and again\n')
  readStream.push(null)
  await seafileHandle.updateFile({ replaceFilepath: '/iav/test.txt', dir: '/iav/' }, { readStream, filename: 'test.txt' })

  // read file contents in plain text form
  const txt = await seafileHandle.readFile({ dir: '/iav/test.txt' })
}

main()


```

# License

MIT