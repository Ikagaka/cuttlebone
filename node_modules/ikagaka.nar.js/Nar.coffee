
class Nar

  XMLHttpRequest = window["XHRProxy"]
  Encoding = window["Encoding"]
  JSZip = window["JSZip"]
  WMDescript = window["WMDescript"]

  @loadFromBuffer: (buffer, callback)->
    zip = Nar.unzip(buffer)
    setTimeout -> callback(null, zip)

  @loadFromURL: (src, callback)->
    Nar.wget src, "arraybuffer", (err, buffer)->
      if !!err then return callback(err, null)
      Nar.loadFromBuffer(buffer, callback)

  @unzip = (buffer)->
    zip = new JSZip()
    zip.load(buffer)
    files = zip.files
    parent = root = {}
    for path, val of files
      ary = path.split("/")
      for dir, i in ary
        obj = if i is ary.length - 1 then val else {}
        parent = parent[dir] = parent[dir] or obj
      parent = root
    root

  @convert = (buffer)->
    Encoding.codeToString(Encoding.convert(new Uint8Array(buffer), 'UNICODE', 'AUTO'))

  @wget = (url, type, callback)->
    xhr = new XMLHttpRequest()
    xhr.addEventListener "load", ->
      if 200 <= xhr.status && xhr.status < 300
        if !!xhr.response.error
        then callback(new Error(xhr.response.error.message), null)
        else callback(null, xhr.response)
      else callback(new Error(xhr.status), null)
    xhr.open("GET", url)
    xhr.responseType = type
    xhr.send()
    undefined

  @parseDescript = (text)->
    WMDescript.parse(text)
