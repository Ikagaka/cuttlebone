### (C) 2014 Narazaka : Licensed under The MIT License - http://narazaka.net/license/MIT?2014 ###

if require? and module?
  JSZip = require('jszip')
  Encoding = require('encoding-japanese')
  unless Promise?
    Promise = require('bluebird')
else if window?
  JSZip = window.JSZip
  Encoding = window.Encoding
  unless Promise?
    Promise = window.Promise

class NarLoader
  @loadFromBuffer: (buffer) ->
    NarLoader.unzip(buffer).then (dir)->
      new NanikaDirectory(dir, {has_install: true, is_root_dir: true})
  @loadFromURL: (src) ->
    NarLoader.wget src, "arraybuffer"
    .then @loadFromBuffer
  @loadFromBlob: (blob) ->
    new Promise (resolve, reject) ->
      reader = new FileReader()
      reader.onload = -> resolve reader.result
      reader.onerror = (event) -> reject event.target.error
      reader.readAsArrayBuffer(blob)
    .then @loadFromBuffer
  @unzip = (buffer) ->
    zip = new JSZip()
    zip.loadAsync(buffer)
    .then (zip)->
      pairs = Object.keys(zip.files)
      .map (filename)-> {filename, zipped: zip.file(filename)}
      .filter ({zipped})-> zipped? # filename が ghost/ のようにディレクトリがzip対象となっていて zipped が null なものがあるので取り除く 
      proms = pairs.map ({filename, zipped})->
        zipped.async("arraybuffer")
        .then (unzipped)-> {filename, unzipped}
      return Promise.all(proms)
    .then (pairs)->
      dic = pairs.reduce ((o, {filename, unzipped})-> o[filename] = unzipped; o), {}
      return dic
    .then (files)->
      dir = {}
      for filePath of files
        path = filePath.split("\\").join("/")
        dir[path] = new NanikaFile(files[filePath])
      dir
  @wget = (url, type) ->
    new Promise (resolve, reject) =>
      if require? and process? and !process.browser # node-webkit / node : fs access
        fs = require 'fs'
        fs.readFile url, (error, buffer) ->
          if error
            reject error
          else
            abuffer = new ArrayBuffer(buffer.length)
            view = new Uint8Array(abuffer)
            i = 0
            while i < buffer.length
              view[i] = buffer.readUInt8(i)
              i++
            resolve abuffer
      else
        xhr = new XMLHttpRequest()
        xhr.addEventListener "load", ->
          if 200 <= xhr.status < 300
            resolve xhr.response
          else
            reject xhr.statusText
        xhr.addEventListener "error", (err)->
          console.error err, err.stack, xhr
          reject xhr.statusText
        xhr.open("GET", url)
        xhr.responseType = type
        xhr.send()

class NanikaFile
  constructor: (@_buffer) ->
    if @_buffer.dir or @_buffer.options?.dir
      @_isdir = true
  buffer: ->
    if @_buffer.asArrayBuffer?
      @_buffer = @_buffer.asArrayBuffer()
    else
      @_buffer
  toString: ->
    Encoding.codeToString(Encoding.convert(new Uint8Array(@buffer()), 'UNICODE', 'AUTO'))
  valueOf: -> @buffer()
  isFile: -> !@_isdir
  isDirectory: -> @_isdir

class NanikaDirectory
  constructor: (files={}, options) ->
    @files = {}
    for path, file of files
      if file instanceof NanikaFile
        @files[path] = file
      else
        @files[path] = new NanikaFile(file)
    @parse(options)
  parse: ({has_install, has_descript, do_throw_descript, is_root_dir}={})->
    if is_root_dir
      nowarp = Object.keys(this.files).filter (filePath)-> /^install\.txt/.exec(filePath)
      wraped = Object.keys(this.files).filter (filePath)-> /^[^\/]+\/install\.txt/.exec(filePath)
      if(nowarp.length is 0 and wraped.length is 1)
        # ghostname/install.txt -> install.txt
        _files = {}
        Object.keys(this.files).forEach (filePath)=>
          _files[filePath.split("/").slice(1).join("/")] = @files[filePath]
        @files = _files
    if @files["install.txt"]?
      @install = NarDescript.parse(@files["install.txt"].toString(), do_throw_descript)
    else if has_install
      throw "install.txt not found"
    if @files["descript.txt"]?
      @descript = NarDescript.parse(@files["descript.txt"].toString(), do_throw_descript)
    else if has_descript
      throw "descript.txt not found"
  asArrayBuffer: ->
    directory = {}
    for path, file of @files
      directory[path] = @files[path].buffer()
    directory
  listChildren: ->
    children = {}
    for path of @files
      if result = path.match /^([^\/]+)/
        children[result[1]] = true
    Object.keys(children)
  addDirectory: (dir, options) ->
    directory = {}
    for path, file of @files
      directory[path] = file
    if dir instanceof NanikaDirectory
      files = dir.files
    else
      files = dir
    for path, file of files
      directory[path] = file
    new NanikaDirectory directory, options
  getDirectory: (dirpath, options) ->
    dirpathre = @pathToRegExp(dirpath)
    directory = {}
    Object.keys(@files)
    .filter (path) -> dirpathre.test path
    .forEach (path) =>
      directory[path.replace(dirpathre, "")] = @files[path]
    new NanikaDirectory directory, options
  wrapDirectory: (dirpath, options) ->
    dirpathcanon = @path.canonical(dirpath)
    directory = {}
    Object.keys(@files)
    .forEach (path) =>
      directory[dirpathcanon + '/' + path] = @files[path]
    new NanikaDirectory directory, options
  getElements: (elempaths, options) ->
    unless elempaths instanceof Array
      elempaths = [elempaths]
    directory = {}
    for elempath in elempaths
      elempathre = @pathToRegExp(elempath)
      Object.keys(@files)
      .filter (path) -> elempathre.test path
      .forEach (path) =>
        directory[path] = @files[path]
    new NanikaDirectory directory, options
  removeElements: (elempaths, options) ->
    unless elempaths instanceof Array
      elempaths = [elempaths]
    directory = {}
    for path, file of @files
      directory[path] = file
    for elempath in elempaths
      elempathre = @pathToRegExp(elempath)
      Object.keys(directory)
      .filter (path) -> elempathre.test path
      .forEach (path) ->
        delete directory[path]
    new NanikaDirectory directory, options
  hasElement: (elempath) ->
    elempathre = @pathToRegExp(elempath)
    for path of @files
      if elempathre.test path
        return true
    return false
  pathToRegExp: (path) ->
    new RegExp '^' + @path.canonical(path).replace(/(\W)/g, '\\$1') + '(?:$|/)'
  path:
    canonical: (path) ->
      path.replace(/\\/g, '/').replace(/^\.?\//, '').replace(/\/?$/, '')

class NarDescript
  @parse: (descript_str, do_throw) ->
    descript_lines = descript_str
    .replace(/(?:\r\n|\r|\n)/g, "\n") # CRLF->LF
    .replace(/^\s*\/\/.*$/mg, "") # remove commentout
    .split(/\n/)

    errors = []
    descript = {}
    for descript_line in descript_lines
      if descript_line.length == 0
        continue
      result = descript_line.match /^\s*([^,]+?)\s*,\s*(.*?)\s*$/
      unless result
        errors.push "wrong descript definition : #{descript_line}"
        continue
      descript[result[1]] = result[2]
    if do_throw
      throw new Error errors.join '\n'
    descript._errors = errors
    descript

if module?.exports?
  module.exports = NarLoader: NarLoader, NanikaFile: NanikaFile, NanikaDirectory: NanikaDirectory, NarDescript: NarDescript
else if window?
  window.NarLoader = NarLoader
  window.NanikaFile = NanikaFile
  window.NanikaDirectory = NanikaDirectory
  window.NarDescript = NarDescript
