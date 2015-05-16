class cuttlebone.BalloonSurface

  constructor: (@element, @scopeId, balloonConf, @balloons)->
    @descript = balloonConf.descript
    @baseCanvas = balloonConf.canvas
    @render()

  destructor: ->
    return

  render: ->
    type = if @scopeId is 0 then "sakura" else "kero"
    util = new cuttlebone.SurfaceRender(@element)
    util.init(@baseCanvas)
    return
