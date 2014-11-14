

class Surface
  $ = window["Zepto"]
  _ = window["_"]
  Promise = window["Promise"]

  constructor: (@scopeId, @surfaceName, @surfaces)->
    srf = @surfaces.surfaces[surfaceName]
    @baseSurface = srf.baseSurface
    @regions = srf.regions || {}
    @animations = srf.animations || {}
    @element = SurfaceUtil.copy(@baseSurface)
    @layers = []
    @stop = false
    $(@element).on "click", (ev)=>
      Surface.processMouseEvent(ev, @scopeId, @regions, "OnMouseClick", (ev)=> @element.dispatchEvent(ev))
    $(@element).on "dblclick", (ev)=>
      Surface.processMouseEvent(ev, @scopeId, @regions, "OnDoubleMouseClick", (ev)=> @element.dispatchEvent(ev))
    $(@element).on "mousemove", (ev)=>
      Surface.processMouseEvent(ev, @scopeId, @regions, "OnMouseMove", (ev)=> @element.dispatchEvent(ev))
    $(@element).on "mousedown", (ev)=>
      Surface.processMouseEvent(ev, @scopeId, @regions, "OnMouseDown", (ev)=> @element.dispatchEvent(ev))
    $(@element).on "mouseup", (ev)=>
      Surface.processMouseEvent(ev, @scopeId, @regions, "OnMouseUp", (ev)=> @element.dispatchEvent(ev))
    Object
      .keys(@animations)
      .forEach (name)=>
        {is:_is, interval, pattern} = @animations[name]
        interval = interval || ""
        tmp = interval.split(",")
        interval = tmp[0]
        n = Number(tmp.slice(1).join(","))
        switch interval
          when "sometimes" then Surface.random   ((callback)=> @playAnimation(_is, callback)), 2
          when "rarely"    then Surface.random   ((callback)=> @playAnimation(_is, callback)), 4
          when "random"    then Surface.random   ((callback)=> @playAnimation(_is, callback)), n
          when "periodic"  then Surface.periodic ((callback)=> @playAnimation(_is, callback)), n
          when "always"    then Surface.always    (callback)=> @playAnimation(_is, callback)
          when "runonce"   then @playAnimation(_is, ->)
          when "never"     then ;
          when "yen-e"     then ;
          when "talk"      then ;
          when "bind"      then ;
          else console.error(@animations[name])

  destructor: ->
    $(@element).off() # g.c.
    @stopAnimation()
    @layers = []
    undefined

  render: ->
    srfs = @surfaces.surfaces
    elements = @layers.reduce(((arr, layer)=>
      if !layer then return arr
      {surface, type, x, y} = layer
      if surface is "-1" then return arr
      hits = Object
        .keys(srfs)
        .filter((name)-> srfs[name].is is surface)
      if hits.length is 0 then return arr
      arr.concat({type, x, y, canvas: srfs[hits[hits.length-1]].baseSurface})
    ), [])
    SurfaceUtil.clear(@element)
    srfutil = new SurfaceUtil(@element)
    srfutil.composeElements([{"type": "base", "canvas": @baseSurface}].concat(elements))
    undefined

  playAnimation: (animationId, callback)->
    hits = Object
      .keys(@animations)
      .filter((name)=> @animations[name].is is animationId)
    if hits.length is 0 then setTimeout(callback); return undefined
    anim = @animations[hits[hits.length-1]]
    anim.patterns
      .map((pattern)=>
        =>
          new Promise (resolve, reject)=>
            {surface, wait} = pattern
            @layers[anim.is] = pattern
            @render()
            if @stop then return console.info("animation stoped")
            [__, a, b] = /(\d+)(?:\-(\d+))?/.exec(wait)
            if b? then wait = _.random(Number(a), Number(b))
            setTimeout(resolve, wait))
      .reduce(((proA, proB)->
        proA.then(proB)), Promise.resolve())
      .then(=> if !@stop then setTimeout(callback))
      .catch((err)-> console.error err.stack)
    undefined

  stopAnimation: (id)->
    @stop = true
    undefined



  @processMouseEvent = (ev, scopeId, regions, eventName, callback)->
    {left, top} = $(ev.target).offset()
    offsetX = ev.pageX - left
    offsetY = ev.pageY - top
    if Surface.isHit(ev.target, offsetX, offsetY)
      ev.preventDefault()
      detail = Surface.createMouseEvent(eventName, scopeId, regions, offsetX, offsetY)
      if !!detail["Reference4"]
      then $(ev.target).css({"cursor": "pointer"})
      else $(ev.target).css({"cursor": "default"})
      callback(new CustomEvent('IkagakaSurfaceEvent', { detail }))
    undefined
  # Surface.processMouseEvent(eventName:ShioriEventIDString, scopeId:Number, regions:{is:Number, top:Number, left:Number, right:Number, bottom:Number, name:String}, offsetX:Number, offsetY:Number):ShioriEventObject
  @createMouseEvent = (eventName, scopeId, regions, offsetX, offsetY)->
    event =
      "ID": eventName
      "Reference0": offsetX|0
      "Reference1": offsetY|0
      "Reference2": 0
      "Reference3": scopeId
      "Reference4": ""
      "Reference5": 0
    hits = Object
      .keys(regions)
      .slice().sort((a, b)-> if a.is > b.is then 1 else -1)
      .filter((name)->
        {name, left, top, right, bottom} = regions[name]
        (left < offsetX < right and top < offsetY < bottom) or
        (right < offsetX < left and bottom < offsetY < top))
    if hits.length isnt 0
      event["Reference4"] = regions[hits[hits.length-1]].name
    event

  @random = (callback, n)->
    ms = 1
    ms++ while Math.round(Math.random() * 1000) > 1000/n
    setTimeout((-> callback(-> Surface.random(callback, n))), ms*1000)

  @periodic = (callback, n)->
    setTimeout((-> callback(-> Surface.periodic(callback, n))), n*1000)

  @always = (callback)->
    callback -> Surface.always(callback)

  @isHit = (canvas, x, y)->
    ctx = canvas.getContext "2d"
    imgdata = ctx.getImageData(0, 0, x, y)
    data = imgdata.data
    data[data.length-1] isnt 0
