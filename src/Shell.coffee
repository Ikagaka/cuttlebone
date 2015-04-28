class Shell

  constructor: (directory)->
    @directory = directory
    @descript = null
    @surfaces = null

  load: ->

    if !!@directory["descript.txt"]
    then @descript = Util.parseDescript(Util.convert(@directory["descript.txt"]))
    else @descript = {}; console.warn("descript.txt is not found")

    keys = Object.keys(@directory)
    hits = keys.filter (name)-> /surfaces\d*\.txt$/.test(name)
    if hits.length is 0
      console.warn("surfaces.txt is not found")
      surfaces = {"surfaces": {}}
    else
      surfaces = hits.reduce(((obj, name)=>
        _srfs = Shell.parseSurfaces(Util.convert(@directory[name]))
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
    hit = keys.filter((name)-> srfs[name].is is _surfaceId)[0]
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
        _baseSurface = SurfaceUtil.copy(baseSurface)
        srfutil = new SurfaceUtil(_baseSurface)
        srfutil.composeElements(sortedElms)
        srfs[name].baseSurface = _baseSurface
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
          path = keys.filter((path)->
            a = path.toLowerCase()
            b = file.toLowerCase()
            if a is b then return true
            if a is (b+".png").toLowerCase()
              console.warn("element file " + b + " need '.png' extension")
              return true
            return false
          )[0]
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
        _prm = _prm.then (cnv)->
          srfs[name].baseSurface = cnv
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
          URL.revokeObjectURL(url)
          pnafilename = filename.replace(/\.png$/i, ".pna")
          cnv = SurfaceUtil.transImage(img)
          if !directory[pnafilename]
          then resolve(SurfaceUtil.transImage(img))
          else
            buffer = directory[pnafilename]
            url = URL.createObjectURL(new Blob([buffer], {type: "image/png"}))
            SurfaceUtil.loadImage url, (err, pnaimg)->
              if !!err
                URL.revokeObjectURL(url)
                console.warn "cannot read pna file", filename, pnafilename, err
                resolve(SurfaceUtil.transImage(img))
              else
                cnv = SurfaceUtil.copy(img)
                pnacnv = SurfaceUtil.copy(pnaimg)
                URL.revokeObjectURL(url)
                resolve(SurfaceUtil.pna(cnv, pnacnv))



  @mergeSurfacesAndSurfacesFiles = (directory)-> (surfaces)->
    new Promise (resolve, reject)->
      srfs = surfaces.surfaces
      keys = Object.keys(directory)
      hits = keys.filter (filename)-> /^surface\d+\.png$/i.test(filename)
      tuples = hits.map (filename)-> [Number((/^surface(\d+)\.png$/i.exec(filename) or ["", "-1"])[1]), filename]
      tuples.forEach ([n, filename])->
        name = Object.keys(srfs).filter((name)-> srfs[name].is is n)[0]
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
