class BalloonSurface

  constructor: (@element, @scopeId, balloonConf, @balloons)->
    @descript = balloonConf.descript
    @baseCanvas = balloonConf.canvas
    @render()

  destructor: ->
    return

  render: ->
    type = if @scopeId is 0 then "sakura" else "kero"
    util = new SurfaceUtil(@element)
    util.init(@baseCanvas)
    return
