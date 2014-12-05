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
    @directory = directory
    @descript = null
    @surfaces = null

  load: ->

    if !!@directory["descript.txt"]
    then @descript = Nar.parseDescript(Nar.convert(@directory["descript.txt"]))
    else @descript = {}; console.warn("descript.txt is not found")

    if !!@directory["surfaces.txt"]
    then surfaces = Shell.parseSurfaces(Nar.convert(@directory["surfaces.txt"]))
    else surfaces = {"surfaces": {}}; console.warn("surfaces.txt is not found")

    prm = Promise.resolve(surfaces)
    prm = prm.then Shell.mergeSurfacesAndSurfacesFiles(@directory)
    prm = prm.then Shell.loadSurfaces(@directory)
    prm = prm.then Shell.loadElements(@directory)
    prm = prm.then Shell.createBases(@directory)
    prm = prm.then (surfaces)=>
      @surfaces = surfaces
      @directory = null
    prm = prm.catch (err)->
      console.error err
      err.message && console.error err.message
      err.stack && console.error err.stack
      throw err
    prm

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

  @createBases = (directory)-> (surfaces)->
    new Promise (resolve, reject)->
      srfs = surfaces.surfaces
      keys = Object.keys(srfs)
      keys.forEach (name)->
        sortedElms = []
        if !!srfs[name].elements
          elms = srfs[name].elements
          _keys = Object.keys(elms)
          mapped = _keys.map (key)->
            is: elms[key].is
            x:  elms[key].x
            y: elms[key].y
            canvas: elms[key].canvas
            type: elms[key].type
          sortedElms = mapped.sort (elmA, elmB)-> if elmA.is > elmB.is then 1 else -1
          delete srfs[name].elements # g.c.
        baseSurface = srfs[name].baseSurface || sortedElms[0]?.canvas
        if !baseSurface
          console.warn(name + " does not have base surface")
          return
        if !!srfs[name].pnaSurface
          baseSurface = SurfaceUtil.pna(baseSurface, srfs[name].pnaSurface)
          delete srfs[name].pnaSurface # g.c.
        srfutil = new SurfaceUtil(baseSurface)
        srfutil.composeElements(sortedElms)
        srfs[name].baseSurface = baseSurface
      resolve(surfaces)

  @loadElements = (directory)-> (surfaces)->
    new Promise (resolve, reject)->
      srfs = surfaces.surfaces
      keys = Object.keys(srfs)
      hits = keys.filter (name)-> !!srfs[name].elements
      promises = []
      hits.forEach (srfName)->
        elmKeys = Object.keys(srfs[srfName].elements)
        elmKeys.forEach (elmName)->
          promises.push new Promise (resolve, reject)->
            elm = srfs[srfName].elements[elmName]
            {type, file, x, y} = elm
            keys = Object.keys(directory)
            path = keys.find (path)->
              a = path.toLowerCase()
              b = file.toLowerCase()
              if a is b then return true
              if a is (b+".png").toLowerCase()
                console.warn("element file " + b + " is need '.png' extension")
                return true
              return false
            if !path
              console.warn "element " + file + " is not found"
              elm.canvas = document.createElement("canvas")
              elm.canvas.width = 1
              elm.canvas.height = 1
              resolve()
              return
            buffer = (directory[path] || directory[path+".png"])
            url = URL.createObjectURL(new Blob([buffer], {type: "image/png"}))
            SurfaceUtil.loadImage url, (err, img)->
              URL.revokeObjectURL(url)
              if !!err then return reject(err.error)
              elm.canvas = SurfaceUtil.transImage(img)
              resolve()
      prm = Promise.all(promises)
      prm = prm.then -> resolve(surfaces)
      prm = prm.catch(reject)
      prm

  @loadSurfaces = (directory)-> (surfaces)->
    new Promise (resolve, reject)->
      srfs = surfaces.surfaces
      keys = Object.keys(srfs)
      promises = []
      hits = keys.filter (name)-> !!srfs[name].buffer
      hits.forEach (name)->
        promises.push new Promise (resolve, reject)->
          buffer = srfs[name].buffer
          url = URL.createObjectURL(new Blob([buffer], {type: "image/png"}))
          SurfaceUtil.loadImage url, (err, img)->
            URL.revokeObjectURL(url)
            if !!err then return reject(err)
            delete srfs[name].buffer # g.c.
            srfs[name].baseSurface = SurfaceUtil.transImage(img)
            resolve()
      _hits = keys.filter (name)-> !!srfs[name].pnabuffer
      _hits.forEach (name)->
        promises.push new Promise (resolve, reject)->
          buffer = srfs[name].pnabuffer
          url = URL.createObjectURL(new Blob([buffer], {type: "image/png"}))
          SurfaceUtil.loadImage url, (err, img)->
            URL.revokeObjectURL(url)
            if !!err then return reject(err)
            delete srfs[name].pnabuffer # g.c.
            srfs[name].pnaSurface = SurfaceUtil.copy(img)
            resolve()
      prm = Promise.all(promises)
      prm = prm.then -> resolve(surfaces)
      prm = prm.catch(reject)
      prm

  @mergeSurfacesAndSurfacesFiles = (directory)-> (surfaces)->
    new Promise (resolve, reject)->
      srfs = surfaces.surfaces
      keys = Object.keys(directory)
      hits = keys.filter (filename)-> /^surface\d+\.png$/i.test(filename)
      tuples = hits.map (filename)-> [Number((/^surface(\d+)\.png$/i.exec(filename) or ["", "-1"])[1]), directory[filename]]
      tuples.forEach ([n, buffer])->
        name = Object.keys(srfs).find (name)-> srfs[name].is is n
        name = name || "surface" + n
        srfs[name] = srfs[name] || {is: n}
        srfs[name].buffer = buffer
        srfs[name].baseSurface = document.createElement("canvas")
        srfs[name].baseSurface.width = 1
        srfs[name].baseSurface.height = 1
      pnahits = keys.filter (filename)-> /^surface\d+\.pna$/i.test(filename)
      pnatuples = pnahits.map (filename)-> [Number((/^surface(\d+)\.pna$/i.exec(filename) or ["", "-1"])[1]), directory[filename]]
      pnatuples.forEach ([n, buffer])->
        name = Object.keys(srfs).find (name)-> srfs[name].is is n
        name = name || "surface" + n
        srfs[name] = srfs[name] || {is: n}
        srfs[name].pnabuffer = buffer
      resolve(surfaces)

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
        delete srfs[name].base # g.c.
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
