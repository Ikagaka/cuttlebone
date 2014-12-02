_ = window["_"]
$ = window["Zepto"]
SurfacesTxt2Yaml = window["SurfacesTxt2Yaml"]

Nar         = window["Nar"]         || window["Ikagaka"]?["Nar"]         || require("ikagaka.nar.js")
Surface     = window["Surface"]     || window["Ikagaka"]?["Surface"]     || require("./Surface.js")
SurfaceUtil = window["SurfaceUtil"] || window["Ikagaka"]?["SurfaceUtil"] || require("./SurfaceUtil.js")

Promise = window["Promise"]
URL = window["URL"]

class Shell

  constructor: (directory)->
    if !directory["descript.txt"] then throw new Error("descript.txt not found")
    @directory = directory
    @descript = null
    @surfaces = null

  load: (callback)->
    @descript = Nar.parseDescript(Nar.convert(@directory["descript.txt"].asArrayBuffer()))
    if !!@directory["surfaces.txt"]
      surfaces = Shell.parseSurfaces(Nar.convert(@directory["surfaces.txt"].asArrayBuffer()))
    else surfaces = {"surfaces": {}}
    mergedSurfaces = Shell.mergeSurfacesAndSurfacesFiles(surfaces, @directory)
    Shell.loadSurfaces mergedSurfaces, (err, loadedSurfaces)=>
      Shell.loadElements loadedSurfaces, @directory, (err, loadedElmSurfaces)=>
        if !!err then return callback(err)
        @surfaces = Shell.createBases(loadedElmSurfaces)
        @directory = null
        callback(null)
    return

  attachSurface: (canvas, scopeId, surfaceId)->
    type = if scopeId is 0 then "sakura" else "kero"
    if Array.isArray(@surfaces.aliases?[type]?[surfaceId])
    then _surfaceId = SurfaceUtil.choice(@surfaces.aliases[type][surfaceId])
    else _surfaceId = surfaceId
    srfs = @surfaces.surfaces
    keys = Object.keys(srfs)
    hit = keys.find (name)-> srfs[name].is is _surfaceId
    if !hit then return null
    return new Surface(canvas, scopeId, hit, @surfaces)

  @createBases = (surfaces)->
    srfs = surfaces.surfaces
    keys = Object.keys(srfs)
    keys.forEach (name)->
      delete srfs[name].file # g.c.
      if !srfs[name].baseSurface
        cnv = document.createElement("canvas")
        cnv.width = 0
        cnv.height = 0
        srfs[name].baseSurface = cnv
      if !srfs[name].elements then return
      elms = srfs[name].elements
      _keys = Object.keys(elms)
      mapped = _keys.map (key)->
        is: elms[key].is
        x:  elms[key].x
        y: elms[key].y
        canvas: elms[key].canvas
        type: elms[key].type
      sortedElms = mapped.sort (elmA, elmB)-> if elmA.is > elmB.is then 1 else -1
      baseSurface = sortedElms[0].canvas || srfs[name].baseSurface
      srfutil = new SurfaceUtil(baseSurface)
      srfutil.composeElements(sortedElms)
      srfs[name].baseSurface = baseSurface
      delete srfs[name].elements # g.c.
    return surfaces

  @loadSurfaces = (surfaces, callback)->
    srfs = surfaces.surfaces
    keys = Object.keys(srfs)
    hits = keys.filter (name)-> !!srfs[name].file
    promises = hits.map (name)->
      new Promise (resolve, reject)->
        setTimeout ->
          buffer = srfs[name].file.asArrayBuffer()
          url = URL.createObjectURL(new Blob([buffer], {type: "image/png"}))
          SurfaceUtil.loadImage url, (err, img)->
            URL.revokeObjectURL(url)
            if !!err then return reject(err)
            srfs[name].baseSurface = SurfaceUtil.transImage(img)
            resolve()
    Promise
      .all(promises)
      .then(-> callback(null, surfaces))
      .catch((err)-> console.error(err, err.stack); callback(err, null))
    return

  @loadElements = (surfaces, directory, callback)->
    srfs = surfaces.surfaces
    keys = Object.keys(srfs)
    hits = keys.filter (name)-> !!srfs[name].elements
    promises = []
    for srfName in hits
      _keys = Object.keys(srfs[srfName].elements)
      for elmName in _keys
        promises.push new Promise (resolve, reject)->
          elm = srfs[srfName].elements[elmName]
          {type, file, x, y} = elm
          keys = Object.keys(directory)
          path = keys.find (path)->
            a = path.toLowerCase()
            b = file.toLowerCase()
            a is b || a is (b+".png").toLowerCase()
          if !path then return reject(new Error("element " + file + " is not found"))
          setTimeout ->
            buffer = (directory[path] || directory[path+".png"]).asArrayBuffer()
            url = URL.createObjectURL(new Blob([buffer], {type: "image/png"}))
            SurfaceUtil.loadImage url, (err, img)->
              URL.revokeObjectURL(url)
              if !!err then return reject(err.error)
              elm.canvas = SurfaceUtil.transImage(img)
              resolve()
    Promise
      .all(promises)
      .then(-> callback(null, surfaces))
      .catch((err)-> console.error(err, err.stack); callback(err, null))
    return

  @mergeSurfacesAndSurfacesFiles = (surfaces, directory)->
    srfs = surfaces.surfaces
    keys = Object.keys(directory)
    hits = keys.filter (filename)-> /^surface\d+\.png$/i.test(filename)
    tuples = hits.map (filename)-> [Number((/^surface(\d+)\.png$/i.exec(filename) or ["", "-1"])[1]), directory[filename]]
    for [n, file] in tuples
      name = Object.keys(srfs).find (name)-> srfs[name].is is n
      name = name || "surface" + n
      srfs[name] = srfs[name] || {is: n}
      srfs[name].file = file
      srfs[name].baseSurface = document.createElement("canvas")
      srfs[name].baseSurface.width = 0
      srfs[name].baseSurface.height = 0
    return surfaces

  @parseSurfaces = (text)->
    surfaces = SurfacesTxt2Yaml.txt_to_data(text, {compatible: 'ssp-lazy'});
    #console.dir surfaces
    #surfaces = $.extend(true, {}, surfaces)
    srfs = surfaces.surfaces
    keys = Object.keys(srfs)
    surfaces.surfaces = keys.reduce(((obj, name)->
      if typeof srfs[name].is isnt "undefined"
      then obj[name] = srfs[name]
      if Array.isArray(srfs[name].base)
        srfs[name].base.forEach (key)->
          $.extend(true, srfs[name], srfs[key])
      obj
    ), {})
    return surfaces

  @SurfaceUtil = SurfaceUtil

if module?.exports?
  module.exports = Shell
else if @Ikagaka?
  @Ikagaka.Shell = Shell
else
  @Shell = Shell
