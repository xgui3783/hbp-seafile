import got from "got"
import fs from "fs"
import path from "path"
const SEAFILE_API_ENDPOINT = process.env.HBP_SEAFILE_API_ENDPOINT || `https://drive.ebrains.eu/api2`

const removeLeadingTrailingDoubleQuote = str => str.replace(/^\"/, '').replace(/\"$/, '')

export class Seafile{
  constructor({ accessToken }){
    if (!accessToken) throw new Error('access token is required')

    this._token = null
    this._defaultRepoId = null
    this._accessToken = accessToken

    this._uploadUrlMap = new Map()
    this._updateUrlMap = new Map()
  }

  static from({ token, accessToken }) {
    const seaFile = new Seafile({ accessToken })
    seaFile._token = token
    return seaFile
  }

  async init(){
    this._token = await got(
      {
        url: `${SEAFILE_API_ENDPOINT}/account/token/`,
        headers: {
          "Authorization": `Bearer ${this._accessToken}`
        }
      }
    ).text()
  }

  async req({ method = 'get', uri, body, formData, form }){
    const _method = method.toLowerCase()
    const _uri = /^http[s]?\:\/\//.test(uri)
      ? uri
      : (`${SEAFILE_API_ENDPOINT}${uri[0] === '/' ? '' : '/'}${uri}`)
    if (_method !== 'get' && _method !== 'post' && _method !== 'delete' && _method !== 'put') {
      throw new Error(`method ${method} not implemented`)
    }
    return got({
      url: _uri,
      method: _method,
      headers: {
        'Authorization': `Token ${this._token}`,
        'Accept': 'application/json'
      }
    }).text()
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

  async _query({ repoId, dir = '/', dirOperation } = {}, reqArg = {}){
    if (!dirOperation) throw new Error(`dirOperation needs to be defined`)
    if (!this._defaultRepoId && !repoId) {
      const repo_id = await this.getDefaultRepoId()
      this._defaultRepoId = repo_id
    }
    const _repoId = repoId || this._defaultRepoId
    return this.req({
      uri: `repos/${_repoId}/${dirOperation}/?p=${dir}`,
      ...reqArg
    })
  }

  getUploadLink({ repoId } = {}){
    return this._query({ repoId, dirOperation: 'upload-link' })
      // getUploadLink response contains leading and trailing double commas. Trim these
      .then(removeLeadingTrailingDoubleQuote)
  }

  getUpdateLink({ repoId, dir } = {}){
    return this._query({ repoId, dir, dirOperation: 'update-link' })
      // getUpdateLink response contains leading and trailing double commas. Trim these
      .then(removeLeadingTrailingDoubleQuote)
  }

  async uploadFile({ readStream, pathToFile, filename }, { repoId, dir='/' } = {}){
    let uploadUrl = this._uploadUrlMap.get(repoId)
    if (!uploadUrl) {
      uploadUrl = await this.getUploadLink({ repoId })
      this._uploadUrlMap.set(repoId, uploadUrl)
    }

    // parent_dir must be the same as query param p
    // https://download.seafile.com/published/web-api/v2.1/file-upload.md
    const relative_path = dir == '/'
      ? null
      : dir.replace(/^\//, '')
    return this.req({
      method: 'post',
      uri: uploadUrl,
      headers: null,
      formData: {
        file: readStream || fs.createReadStream(pathToFile),
        filename: filename || path.basename(pathToFile) || 'Untitled',
        parent_dir: '/',
        relative_path,
      }
    })
  }

  ls({ repoId, dir = '/' } = {}){
    const _dir = `${dir[0] === '/' ? '' : '/'}${dir}`
    return this._query({ repoId, dir: _dir, dirOperation: 'dir' })
      .then(d => JSON.parse(d))
  }

  mkdir({ repoId, dir } = {}){
    if (!dir) throw new Error('dir is required for mkdir')
    const _dir = `${dir[0] === '/' ? '' : '/'}${dir}`
    
    const formData = {
      operation: 'mkdir'
    }

    return this._query({ repoId, dir: _dir, dirOperation: 'dir' }, { method: 'post', formData })
  }

  async updateFile({ repoId, dir, replaceFilepath } = {}, { readStream, pathToFile, filename }){
    if (!replaceFilepath) throw new Error(`file to be replaced needs to be defined`)

    let _map = this._updateUrlMap.get(repoId)
    if (!_map) {
      _map = new Map()
      this._updateUrlMap.set(repoId, _map)
    } 
    let updateLink = _map.get(dir)
    if (!updateLink) {
      updateLink = await this.getUpdateLink({ repoId, dir })
      _map.set(dir, updateLink)
    }
    const formData = {
      target_file: replaceFilepath,
      file: readStream || fs.createReadStream(pathToFile),
      filename: filename || path.basename(pathToFile) || 'Untitled',
      parent_dir: '/'
    }
    return this.req({
      method: 'post',
      uri: updateLink,
      formData
    })
  }

  async readFile({ repoId, dir, reuse }) {
    if (!dir) throw new Error(`dir is required for readFile`)
    const _dir = `${dir[0] === '/' ? '' : '/'}${dir}`
    const uri = await this._query({ repoId, dir: _dir, dirOperation: 'file' })
      .then(removeLeadingTrailingDoubleQuote)
    return this.req({
      uri
    })
  }
}
