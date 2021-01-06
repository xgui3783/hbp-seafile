type SeafileRepoArgument = {
  repoId:string
}

type SeafileDirArgument = {
  dir:string
}

type SeafileRepoDirArgument = SeafileRepoArgument & SeafileDirArgument
type SeafileConstructorArgument = {
  accessToken: string
}

type SeafileRequestArgument = {
  method?:'get'|'post'|'delete'|'put'
  uri:string
  formData?:any
  form?:any
}

type FileInputInterface = {
  readStream:ReadableStream
  pathToFile:string
  filename:string
}


export class Seafile{
  constructor(arg:SeafileConstructorArgument){

  }

  static from:({ token, accessToken }: { token: string, accessToken: string }) => Seafile

  init:() => Promise<any>

  getRepos:() => Promise<any>
  getDefaultRepoId:() => Promise<string>
  
  uploadFile:(fileinput:FileInputInterface, output?:SeafileRepoDirArgument)=>Promise<any>
  updateFile:(replaceArg:{replaceFilepath:string}&SeafileRepoDirArgument, replacementArg:FileInputInterface)=>Promise<any>
  readFile:(readArg:SeafileRepoDirArgument) => Promise<any>

  ls:(repoDir?:SeafileRepoDirArgument)=>Promise<any>
  mkdir:(repoDir?:SeafileRepoDirArgument)=>Promise<any>
}
