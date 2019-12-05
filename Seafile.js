const request = require('request')
const fs = require('fs')
const path = require('path')
const SEAFILE_API_ENDPOINT = process.env.HBP_SEAFILE_API_ENDPOINT || `https://drive.humanbrainproject.eu/api2`

class Seafile{
  constructor({ accessToken }){
    if (!accessToken) throw new Error('access token is required')

    this._token = null
    this._defaultRepoId = null
    this._accessToken = accessToken

    this._uploadUrlMap = new Map()
  }

  init(){
    return new Promise(rs => {

      request.get({
        uri: `${SEAFILE_API_ENDPOINT}/account/token/`,
        auth: {
          bearer: this._accessToken
        }
      }, (err, resp, body) => {
        if (err) throw err
        if (resp.statusCode >= 400) {
          console.log(body)
          throw resp.statusCode
        }
        this._token = body
        rs()
      })
    })
  }

  req({ method = 'get', uri, body, formData, form }){
    const _method = method.toLowerCase()
    const _uri = /^http[s]?\:\/\//.test(uri) ? uri : (`${SEAFILE_API_ENDPOINT}${uri[0] === '/' ? '' : '/'}${uri}`)
    if (_method !== 'get' && _method !== 'post' && _method !== 'delete' && _method !== 'put') {
      throw new Error(`method ${method} not implemented`)
    }
    return new Promise( rs=> {
      request({
        uri: _uri,
        method: _method,
        headers: {
          'Authorization': `Token ${this._token}`,
          'Accept': 'application/json'
        },
        ...(body ? { body } : {}),
        ...(formData ? { formData } : {}),
        ...(form ? { form } : {})
      }, (err, resp, body) => {
        if (err) throw err
        if (resp.statusCode >= 400) {
          console.log(body)
          throw resp.statusCode
        }
        rs(body)
      })
    })
  }

  get token(){
    return this._token
  }

  getRepos(){
    return this.req({
      uri: '/repos/'
    }).then(data => JSON.parse(data))
  }

  getDefaultRepoId(){
    return this.req({
      uri: '/default-repo/'
    })
      .then(data => JSON.parse(data))
      .then(({ repo_id }) => {
        this._defaultRepoId = repo_id
        return repo_id
      })
  }

  async getUploadLink({ repoId }){
    if (!this._defaultRepoId && !repoId) {
      const repo_id = await this.getDefaultRepoId()
      this._defaultRepoId = repo_id
    }

    const _repoId = repoId || this._defaultRepoId
    return this.req({
      uri: `repos/${_repoId}/upload-link/?p=/iav/`
    })
  }

  async uploadFile({ writeStream, pathToFile, filename }, { repoId, dir='/' } = {}){
    let uploadUrl = this._uploadUrlMap.get(repoId)
    if (!uploadUrl) {
      uploadUrl = await this.getUploadLink({ repoId })

      // getUploadLink response contains leading and trailing double commas. Trim these
      uploadUrl = uploadUrl.replace(/^\"/, '').replace(/\"$/, '')
      this._uploadUrlMap.set(repoId, uploadUrl)
    }
    return this.req({
      method: 'post',
      uri: uploadUrl,
      formData: {
        file: writeStream || fs.createReadStream(pathToFile),
        filename: filename || path.basename(pathToFile) || 'Untitled',
        parent_dir: dir
      }
    })
  }

  async ls({ repoId, dir = '/' } = {}){
    const _dir = `${dir[0] === '/' ? '' : '/'}${dir}`
    const _repo = repoId || this._defaultRepoId || await this.getDefaultRepoId()
    const uri = `/repos/${_repo}/dir?p=${_dir}`
    return this.req({
      uri
    }).then(r => JSON.parse(r))
  }

  async mkdir({ repoId, dir } = {}){
    if (!dir) throw new Error('dir is required for mkdir')
    const _dir = `${dir[0] === '/' ? '' : '/'}${dir}`
    const _repo = repoId || this._defaultRepoId || await this.getDefaultRepoId()

    // somehow, the trailing slash at /dir/ is important. or else everything breaks?
    const uri = `/repos/${_repo}/dir/?p=${_dir}`
    const formData = {
      operation: 'mkdir'
    }
    return this.req({
      method: 'post',
      uri,
      formData
    })
  }
}

module.exports = {
  Seafile
}