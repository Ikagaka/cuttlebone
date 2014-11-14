


class Shell

  _ = window["_"]
  Nar = window["Nar"]
  Promise = window["Promise"]
  Surface = window["Surface"]
  SurfacesTxt2Yaml = window["SurfacesTxt2Yaml"]
  URL = window["URL"]

  constructor: (tree)->
    if !tree["descript.txt"] then throw new Error("descript.txt not found")
    @tree = tree
    @descript = Nar.parseDescript(Nar.convert(@tree["descript.txt"].asArrayBuffer()))
    @surfaces = null

  load: (callback)->
    if !!@tree["surfaces.txt"]
    then surfacesYaml = Shell.parseSurfaces(Nar.convert(@tree["surfaces.txt"].asArrayBuffer()))
    else surfacesYaml = {"surfaces": {}}
    merged = Shell.mergeSurfacesAndSurfacesFiles(surfacesYaml, @tree)
    Shell.loadSurfaces merged, @tree, (err, loaded)=>
      Shell.loadElements loaded, @tree, (err, loaded)=>
        if !!err then return callback(err)
        @surfaces = Shell.createBases(loaded)
        callback(null)

  getSurface: (scopeId, surfaceId)->
    # alias choice process with scopeID
    # @surfaces.sakrua
    n = surfaceId
    srfs = @surfaces.surfaces
    hits = Object
      .keys(srfs)
      .filter((name)-> Number(srfs[name].is) is n)
    if hits.length is 0
    then return null
    new Surface(scopeId, srfs[hits[0]], @surfaces)

  @createBases = (loaded)->
    srfs = loaded.surfaces
    Object.keys(srfs).forEach (name)->
      srfs[name].is = srfs[name].is
      cnv = srfs[name].canvas
      if !srfs[name].elements
        srfs[name].base = cnv
      else
        sorted = Object
          .keys(srfs[name].elements)
          .sort((a, b)-> if a.is > b.is then 1 else -1)
          .map (key)-> srfs[name].elements[key]
        base = sorted[0].canvas || srfs[name].canvas
        srfutil = new SurfaceUtil(base)
        srfutil.composeElements(sorted)
        srfs[name].base = base
      srfs[name].canvas = null # g.c.
    loaded

  @loadSurfaces = (merged, surfacesDir, callback)->
    srfs = merged.surfaces
    promises = Object.keys(srfs)
      .filter((name)-> !!srfs[name].file)
      .map (name)->
        new Promise (resolve, reject)->
          setTimeout ->
            buffer = srfs[name].file.asArrayBuffer()
            url = URL.createObjectURL(new Blob([buffer], {type: "image/png"}))
            SurfaceUtil.loadImage url, (err, img)->
              URL.revokeObjectURL(url)
              if !!err then return reject(err)
              srfs[name].canvas = SurfaceUtil.transImage(img)
              resolve()
    Promise
      .all(promises)
      .then(-> callback(null, merged))
      .catch((err)-> console.error(err, err.stack); callback(err, null))
    undefined

  @loadElements = (merged, surfacesDir, callback)->
    srfs = merged.surfaces
    promises = Object.keys(srfs)
      .filter((name)-> !!srfs[name].elements)
      .reduce(((arr, srfName)->
        arr.concat Object.keys(srfs[srfName].elements).map (elmName)->
          elm = srfs[srfName].elements[elmName]
          new Promise (resolve, reject)->
            setTimeout ->
              {type, file, x, y} = elm
              if !surfacesDir[file] then file += ".png"
              if !surfacesDir[file] then reject(new Error(file.substr(0, file.length-4) + "element file not found"))
              buffer = surfacesDir[file].asArrayBuffer()
              url = URL.createObjectURL(new Blob([buffer], {type: "image/png"}))
              SurfaceUtil.loadImage url, (err, img)->
                URL.revokeObjectURL(url)
                if !!err then return reject(err.error)
                elm.canvas = SurfaceUtil.transImage(img)
                resolve()
      ), [])
    Promise
      .all(promises)
      .then(-> callback(null, merged))
      .catch((err)-> console.error(err, err.stack); callback(err, null))
    undefined

  @mergeSurfacesAndSurfacesFiles = (surfaces, surfacesDir)->
    Object
      .keys(surfacesDir)
      .filter((filename)-> /^surface\d+\.png$/i.test(filename))
      .map((filename)-> [Number((/^surface(\d+)\.png$/i.exec(filename) or ["", "-1"])[1]), surfacesDir[filename]])
      .reduce(((surfaces, [n, file])->
        name = "surface" + n
        srfs = surfaces.surfaces
        if !srfs[name]
          srfs[name] = {is: ""+n}
        srfs[name].file = file
        srfs[name].canvas = null
        srfs[name].base = null
        surfaces
      ), surfaces)

  @parseSurfaces = (text)->
    data = SurfacesTxt2Yaml.txt_to_data(text)
    data.surfaces = Object
      .keys(data.surfaces)
      .reduce(((obj, name)->
        if data.surfaces[name].is?
        then obj[name] = data.surfaces[name]
        if data.surfaces[name].base?
          data.surfaces[name].base.forEach (key)->
            data.surfaces[name] = _.extend(data.surfaces[name], data.surfaces[key])
        obj
      ), {})
    data
