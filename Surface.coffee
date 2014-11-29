$ = @Zepto
_ = @_
SurfaceUtil = @SurfaceUtil || @Ikagaka?["SurfaceUtil"] || require("./SurfaceUtil.js")
Promise = @Promise

class Surface

  constructor: (@element, @scopeId, @surfaceName, @surfaces)->
    srf = @surfaces.surfaces[surfaceName]
    @baseSurface = srf.baseSurface
    @regions = srf.regions || {}
    @animations = srf.animations || {}
    @bufferCanvas = SurfaceUtil.copy(@baseSurface)
    @stopFlags = {}
    @layers = {}
    @destructed = false
    @talkCount = 0
    @talkCounts = {}
    @isPointerEventsShimed = false
    @lastEventType = ""
    $(@element).on "contextmenu",(ev)=> @processMouseEvent(ev, "OnMouseClick",       ($ev)=> $(@element).trigger($ev))
    $(@element).on "click",      (ev)=> @processMouseEvent(ev, "OnMouseClick",       ($ev)=> $(@element).trigger($ev))
    $(@element).on "dblclick",   (ev)=> @processMouseEvent(ev, "OnMouseDoubleClick", ($ev)=> $(@element).trigger($ev))
    $(@element).on "mousedown",  (ev)=> @processMouseEvent(ev, "OnMouseDown",        ($ev)=> $(@element).trigger($ev))
    $(@element).on "mousemove",  (ev)=> @processMouseEvent(ev, "OnMouseMove",        ($ev)=> $(@element).trigger($ev))
    $(@element).on "mouseup",    (ev)=> @processMouseEvent(ev, "OnMouseUp",          ($ev)=> $(@element).trigger($ev))
    $(@element).on "touchmove",  (ev)=> @processMouseEvent(ev, "OnMouseMove",        ($ev)=> $(@element).trigger($ev))
    $(@element).on "touchend",   (ev)=> @processMouseEvent(ev, "OnMouseUp",          ($ev)=> $(@element).trigger($ev))
    $(@element).on "touchstart", do =>
      touchOnce = false
      (ev)=>
        touchOnce = !touchOnce
        if touchOnce
          Surface.processMouseEvent(ev, @scopeId, @regions, "OnMouseDown", ($ev)=> $(@element).trigger($ev))
          setTimeout((-> touchOnce = false), 500)

    keys = Object.keys(@animations)
    keys.forEach (name)=>
      {is:_is, interval, pattern} = @animations[name]
      animationId = _is
      interval = interval || ""
      tmp = interval.split(",")
      interval = tmp[0]
      n = Number(tmp.slice(1).join(","))
      switch interval
        when "sometimes" then Surface.random   ((callback)=> if !@destructed and !@stopFlags[animationId] then @play(animationId, callback)), 2
        when "rarely"    then Surface.random   ((callback)=> if !@destructed and !@stopFlags[animationId] then @play(animationId, callback)), 4
        when "random"    then Surface.random   ((callback)=> if !@destructed and !@stopFlags[animationId] then @play(animationId, callback)), n
        when "periodic"  then Surface.periodic ((callback)=> if !@destructed and !@stopFlags[animationId] then @play(animationId, callback)), n
        when "always"    then Surface.always    (callback)=> if !@destructed and !@stopFlags[animationId] then @play(animationId, callback)
        when "runonce"   then @play(animationId)
        when "never"     then ;
        when "bind"      then ;
        when "yen-e"     then ;
        when "talk"      then @talkCounts[name] = n;
        else
          if /^bind(?:\+(\d+))/.test(interval) then ;
          console.error(@animations[name])
    @render()

  destructor: ->
    SurfaceUtil.clear(@element)
    $(@element).off() # g.c.
    @destructed = true
    @layers = {}
    return

  yenE: ->
    keys = Object.keys(@animations)
    hits = keys.filter((name)=>
      @animations[name].interval is "yen-e" and
      @talkCount % @talkCounts[name] is 0)
    hits.forEach (name)=> @play(@animations[name].is)
    return

  talk: ->
    @talkCount++
    keys = Object.keys(@animations)
    hits = keys.filter (name)=>
        /^talk/.test(@animations[name].interval) and
        @talkCount % @talkCounts[name] is 0
    hits.forEach (name)=> @play(@animations[name].is)
    return

  render: ->
    srfs = @surfaces.surfaces
    keys = Object.keys(@layers)
    sorted = keys.sort (layerNumA, layerNumB)-> if Number(layerNumA) > Number(layerNumB) then 1 else -1
    mapped = sorted.map (key)=> @layers[key]
    patterns = mapped.reduce(((arr, pat)=>
      {surface, type, x, y} = pat
      if surface is -1 then return arr
      keys = Object.keys(srfs)
      hit = keys.find (key)-> srfs[key].is is surface
      if !hit is 0 then return arr
      arr.concat({
        type: type,
        x: x,
        y: y,
        canvas: srfs[hit].baseSurface
      })
    ), [])
    SurfaceUtil.clear(@bufferCanvas)
    util = new SurfaceUtil(@bufferCanvas)
    util.composeElements([{"type": "base", "canvas": @baseSurface}].concat(patterns))
    SurfaceUtil.clear(@element)
    util2 = new SurfaceUtil(@element)
    util2.init(@bufferCanvas)
    return

  play: (animationId, callback=->)->
    keys = Object.keys(@animations)
    hit = keys.find (name)=> @animations[name].is is animationId
    if !hit then setTimeout(callback); return
    anim = @animations[hit]
    lazyPromises = anim.patterns.map (pattern)=> =>
      new Promise (resolve, reject)=>
        {surface, wait, type} = pattern
        if /^start\,\d+/.test(type)
          animId = Number(type.split(",")[1])
          @play animId, -> resolve()
          return
        if /^stop\,\d+/.test(type)
          animId = Number(type.split(",")[1])
          @stop animId, -> resolve()
          return
        if /^alternativestart\,[\(\[](\d+(?:\[\,\.]\d+)*)[\)\]]/.test(type)
          [__, match] = /^alternativestop\,[\(\[](\d+(?:\[\,\.]\d+)*)[\)\]]/.exec(type)
          arr = match.split(/[\,\.]/)
          if arr.length > 0
            animId = Number(SurfaceUtil.choice(arr))
            @play animId, -> resolve()
            return
        if /^alternativestop\,[\(\[](\d+(?:\[\,\.]\d+)*)[\)\]]/.test(type)
          [__, match] = /^alternativestop\,[\(\[](\d+(?:\[\,\.]\d+)*)[\)\]]/.exec(type)
          arr = match.split(/[\,\.]/)
          if arr.length > 0
            animId = Number(SurfaceUtil.choice(arr))
            @stop(animId)
            resolve()
            return
        @layers[anim.is] = pattern
        @render()
        # ex. 100-200 ms wait
        [__, a, b] = /(\d+)(?:\-(\d+))?/.exec(wait)
        if !!b
          wait = _.random(Number(a), Number(b))
        setTimeout((=>
          if @destructed # stop pattern animation.
          then reject()
          else resolve()
        ), wait)
    promise = lazyPromises.reduce(((proA, proB)-> proA.then(proB)), Promise.resolve()) # Promise.resolve().then(prom).then(prom)...
    promise
      .then(=> setTimeout(callback))
      .catch (err)-> if !!err then console.error err.stack
    return

  stop: (animationId)->
    @stopFlags[animationId] = true
    return

  bind: (animationId)->
    keys = Object.keys(@animations)
    hit = keys.find (name)=> @animations[name].is is animationId
    if hit then return undefined
    anim = @animations[hit]
    if anim.patterns.length is 0 then return undefined
    interval = anim.interval
    pattern = anim.patterns[anim.patterns.length-1]
    @layers[anim.is] = pattern
    @render()
    if /^bind(?:\+(\d+))/.test(interval)
      animIds = interval.split("+").slice(1)
      animIds.forEach (animId)=> @play(animId, ->)
    return

  unbind: (animationId)->
    delete @layers[animationId]
    return

  processMouseEvent: (ev, eventName, callback)->
    ev.preventDefault()
    $(ev.target).css({"cursor": "default"})
    if @isPointerEventsShimed and ev.type is @lastEventType
      @lastEventType = ""
      @isPointerEventsShimed = false
      ev.stopPropagation()
      return
    if /^touch/.test(ev.type)
    then {pageX, pageY} = ev.changedTouches[0]
    else {pageX, pageY} = ev
    {left, top} = $(ev.target).offset()
    offsetX = pageX - left
    offsetY = pageY - top
    if Surface.isHit(ev.target, offsetX, offsetY)
      detail =
        "ID": eventName
        "Reference0": offsetX|0
        "Reference1": offsetY|0
        "Reference2": 0
        "Reference3": @scopeId
        "Reference4": ""
        "Reference5": (if ev.button is 2 then 1 else 0)
      keys = Object.keys(@regions)
      sorted = keys.sort (a, b)-> if a.is > b.is then 1 else -1
      hit = sorted.find (name)=>
        {name, left, top, right, bottom} = @regions[name]
        (left < offsetX < right and top < offsetY < bottom) or
        (right < offsetX < left and bottom < offsetY < top)
      if !!hit
        detail["Reference4"] = @regions[hit].name
        $(ev.target).css({"cursor": "pointer"})
      callback($.Event('IkagakaSurfaceEvent', {detail, bubbles: true }))
    else
      # pointer-events shim
      ev.stopPropagation()
      @isPointerEventsShimed = true
      @lastEventType = ev.type
      $(ev.target).css({display: 'none'})
      elm = document.elementFromPoint(pageX, pageY)
      if !elm then return
      $(ev.target).css({display: 'inline-block'})
      _ev = document.createEvent(ev.constructor.name)
      _ev.initMouseEvent?(
        ev.type,
        ev.bubbles,
        ev.cancelable,
        ev.view,
        ev.detail,
        ev.screenX,
        ev.screenY,
        ev.clientX,
        ev.clientY,
        ev.ctrlKey,
        ev.altKey,
        ev.shiftKey,
        ev.metaKey,
        ev.button,
        ev.relatedTarget)
      elm.dispatchEvent(_ev)
    return

  @random = (callback, n)->
    ms = 1
    ms++ while Math.round(Math.random() * 1000) > 1000/n
    setTimeout((-> callback(-> Surface.random(callback, n))), ms*1000)
    return

  @periodic = (callback, n)->
    setTimeout((-> callback(-> Surface.periodic(callback, n))), n*1000)
    return

  @always = (callback)->
    callback -> Surface.always(callback)
    return

  @isHit = (canvas, x, y)->
    ctx = canvas.getContext("2d")
    imgdata = ctx.getImageData(0, 0, x+1, y+1)
    data = imgdata.data
    return data[data.length-1] isnt 0

if module?.exports?
  module.exports = Surface
else if @Ikagaka?
  @Ikagaka.Surface = Surface
else
  @Surface = Surface
