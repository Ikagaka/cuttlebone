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

    keys = Object.keys(@directory)
    hits = keys.filter (name)-> /surfaces\d*\.txt$/.test(name)
    if hits.length is 0
      console.warn("surfaces.txt is not found")
      surfaces = {"surfaces": {}}
    else
      surfaces = hits.reduce(((obj, name)=>
        _srfs = Shell.parseSurfaces(Nar.convert(@directory[name]))
        $.extend(true, obj, _srfs)
      ), {})

    prm = Promise.resolve(surfaces)
    prm = prm.then Shell.mergeSurfacesAndSurfacesFiles(@directory)
    prm = prm.then Shell.loadSurfaces(@directory)
    prm = prm.then Shell.loadElements(@directory)
    prm = prm.then Shell.createBases(@directory)
    prm = prm.then (surfaces)=>
      @surfaces = surfaces
      @directory = null
      return @
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
        baseSurface = SurfaceUtil.copy(baseSurface)
        baseSurface = SurfaceUtil.transImage(baseSurface)
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
            return
          if !!directory[path]
          then filename = path
          else if !!directory[path + ".png"]
          then filename = path + ".png"
          else filename = null
          if !!filename
            _prm = Promise.resolve(filename)
            _prm = _prm.then(Shell.loadPNGAndPNA(directory))
            _prm = _prm.then (cnv)-> elm.canvas = cnv
            _prm = _prm.catch(reject)
            promises.push _prm
      prm = Promise.all(promises)
      prm = prm.then -> resolve(surfaces)
      prm = prm.catch(reject)
      prm

  @loadSurfaces = (directory)-> (surfaces)->
    new Promise (resolve, reject)->
      srfs = surfaces.surfaces
      keys = Object.keys(srfs)
      hits = keys.filter (name)-> !!srfs[name].filename
      promises = hits.map (name)->
        _prm = Promise.resolve(srfs[name].filename)
        _prm = _prm.then(Shell.loadPNGAndPNA(directory))
        _prm = _prm.then (cnv)-> srfs[name].baseSurface = cnv
        _prm = _prm.catch(reject)
        _prm
      prm = Promise.all(promises)
      prm = prm.then -> resolve(surfaces)
      prm = prm.catch(reject)
      prm

  @loadPNGAndPNA = (directory)-> (filename)->
    new Promise (resolve, reject)->
      buffer = directory[filename]
      url = URL.createObjectURL(new Blob([buffer], {type: "image/png"}))
      SurfaceUtil.loadImage url, (err, img)->
        if !!err
          URL.revokeObjectURL(url)
          reject(err)
        else
          cnv = SurfaceUtil.copy(img)
          URL.revokeObjectURL(url)
          filename = filename.replace(/\.png$/, ".pna")
          if !directory[filename.replace(/\.png$/, ".pna")]
          then resolve(SurfaceUtil.transImage(cnv))
          else
            buffer = directory[filename]
            url = URL.createObjectURL(new Blob([buffer], {type: "image/png"}))
            SurfaceUtil.loadImage url, (err, img)->
              if !!err
                URL.revokeObjectURL(url)
                resolve(SurfaceUtil.transImage(cnv))
              else
                pnacnv = SurfaceUtil.copy(img)
                URL.revokeObjectURL(url)
                cnv = SurfaceUtil.pna(cnv, pnacnv)
                resolve(cnv)





  @mergeSurfacesAndSurfacesFiles = (directory)-> (surfaces)->
    new Promise (resolve, reject)->
      srfs = surfaces.surfaces
      keys = Object.keys(directory)
      hits = keys.filter (filename)-> /^surface\d+\.png$/i.test(filename)
      tuples = hits.map (filename)-> [Number((/^surface(\d+)\.png$/i.exec(filename) or ["", "-1"])[1]), filename]
      tuples.forEach ([n, filename])->
        name = Object.keys(srfs).find (name)-> srfs[name].is is n
        name = name || "surface" + n
        srfs[name] = srfs[name] || {is: n}
        srfs[name].filename = filename
        srfs[name].baseSurface = document.createElement("canvas")
        srfs[name].baseSurface.width = 1
        srfs[name].baseSurface.height = 1
      resolve(surfaces)


  # expand SurfacesTxtYaml Object "base" property
  @parseSurfaces = (text)->
    surfaces = SurfacesTxt2Yaml.txt_to_data(text, {compatible: 'ssp-lazy'});
    #console.log surfaces
    #console.log JSON.stringify(surfaces, null, "  ")
    #surfaces = $.extend(true, {}, surfaces)
    surfaces.surfaces = surfaces.surfaces || {}
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
