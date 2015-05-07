class Balloon

  constructor: (directory)->
    @directory = directory
    @descript = null
    @balloons =
      "sakura": []
      "kero": []
      "communicate": []
      "online": []
      "arrow": []
      "sstp": null
      "thumbnail": null

  load: ->

    if !!@directory["descript.txt"]
    then @descript = Util.parseDescript(Util.convert(@directory["descript.txt"]))
    else @descript = {}; console.warn("descript.txt is not found")

    prm = Promise.resolve(@balloons)
    prm = prm.then Balloon.loadBalloonSurfaces(@directory)
    prm = prm.then Balloon.loadBalloonDescripts(@directory, @descript)
    prm = prm.then (balloons)=>
      @balloons = balloons
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
    if !@balloons[type][surfaceId]? then return null
    return new BalloonSurface(canvas, scopeId, @balloons[type][surfaceId], @balloons)

  @loadBalloonDescripts: (directory, descript)-> (balloons)->
    new Promise (resolve, reject)->
      keys = Object.keys(directory)
      hits = keys.filter (filepath)-> /balloon([sk])(\d+)s\.txt$/.test(filepath)
      hits.forEach (filepath)->
        buffer = directory[filepath]
        _descript = Util.parseDescript(Util.convert(buffer))
        [__, type, n] = /balloon([sk])(\d+)s\.txt$/.exec(filepath)
        switch type
          when "s" then balloons["sakura"][Number(n)].descript = $.extend(true, _descript, descript)
          when "k" then balloons["kero"][Number(n)].descript = $.extend(true, _descript, descript)
      resolve(balloons)

  @loadBalloonSurfaces: (directory)-> (balloons)->
    keys = Object.keys(directory)
    hits = keys.filter((filepath)-> /[^\/]+\.png$/.test(filepath))
    promises = hits.map (filepath)->
      new Promise (resolve, reject)->
        buffer = directory[filepath]
        url = URL.createObjectURL(new Blob([buffer], {type: "image/png"}))
        SurfaceUtil.loadImage url, (err, img)->
          if !!err then return reject(err)
          URL.revokeObjectURL(url)
          if !!err then return reject(err)
          if /^balloon([ksc])(\d+)\.png$/.test(filepath)
            [__, type, n] = /^balloon([ksc])(\d+)\.png$/.exec(filepath)
            switch type
              when "s" then balloons["sakura"][Number(n)] = {canvas: SurfaceUtil.transImage(img)}
              when "k" then balloons["kero"][Number(n)] = {canvas: SurfaceUtil.transImage(img)}
              when "c" then balloons["communicate"][Number(n)] = {canvas: SurfaceUtil.transImage(img)}
          else if /^online(\d+)\.png$/.test(filepath)
            [__, n] = /^online(\d+)\.png$/.exec(filepath)
            balloons["online"][Number(n)] = {canvas: SurfaceUtil.transImage(img)}
          else if /^arrow(\d+)\.png$/.test(filepath)
            [__, n] = /^arrow(\d+)\.png$/.exec(filepath)
            balloons["arrow"][Number(n)] = {canvas: SurfaceUtil.transImage(img)}
          else if /^sstp\.png$/.test(filepath)
            balloons["sstp"] = {canvas: SurfaceUtil.transImage(img)}
          else if /^thumbnail\.png$/.test(filepath)
            balloons["thumbnail"] = {canvas: SurfaceUtil.transImage(img)}
          resolve()
    new Promise (resolve, reject)->
      Promise.all(promises).then -> resolve(balloons)
