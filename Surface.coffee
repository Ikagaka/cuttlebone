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
    @bufferCanvas = SurfaceUtil.copy(@baseSurface || document.createElement("canvas"))
    @stopFlags = {}
    @layers = {}
    @destructed = false
    @talkCount = 0
    @talkCounts = {}
    @isPointerEventsShimed = false
    @lastEventType = ""
    $(@element).on "contextmenu",(ev)=> @processMouseEvent(ev, "mouseclick",    ($ev)=> $(@element).trigger($ev))
    $(@element).on "click",      (ev)=> @processMouseEvent(ev, "mouseclick",    ($ev)=> $(@element).trigger($ev))
    $(@element).on "dblclick",   (ev)=> @processMouseEvent(ev, "mousedblclick", ($ev)=> $(@element).trigger($ev))
    $(@element).on "mousedown",  (ev)=> @processMouseEvent(ev, "mousedown",     ($ev)=> $(@element).trigger($ev))
    $(@element).on "mousemove",  (ev)=> @processMouseEvent(ev, "mousemove",     ($ev)=> $(@element).trigger($ev))
    $(@element).on "mouseup",    (ev)=> @processMouseEvent(ev, "mouseup",       ($ev)=> $(@element).trigger($ev))
    do =>
      tid = 0
      touchCount = 0
      touchStartTime = 0
      $(@element).on "touchmove",  (ev)=> @processMouseEvent(ev, "mousemove", ($ev)=> $(@element).trigger($ev))
      $(@element).on "touchend",   (ev)=>
        @processMouseEvent(ev, "mouseup", ($ev)=> $(@element).trigger($ev))
        @processMouseEvent(ev, "mouseclick", ($ev)=> $(@element).trigger($ev))
        if Date.now() - touchStartTime < 500 and touchCount%2 is 0
          @processMouseEvent(ev, "mousedblclick", ($ev)=> $(@element).trigger($ev))
      $(@element).on "touchstart", (ev)=>
        touchCount++
        touchStartTime = Date.now()
        @processMouseEvent(ev, "mousedown", ($ev)=> $(@element).trigger($ev))
        clearTimeout(tid)
        tid = setTimeout (=>touchCount=0), 500

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
          if /^bind(?:\+(\d+))/.test(interval)
          then ;
          else console.warn(@animations[name])
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
      if !hit then return arr
      arr.concat({
        type: type,
        x: x,
        y: y,
        canvas: srfs[hit].baseSurface
      })
    ), [])
    SurfaceUtil.clear(@bufferCanvas)
    util = new SurfaceUtil(@bufferCanvas)
    if !!@baseSurface or patterns.length > 0
      base = @baseSurface || patterns[0].canvas
      util.composeElements([{"type": "base", "canvas": base}].concat(patterns))
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
        {surface, wait, type, animation_ids} = pattern
        if /^start/.test(type)
          _animId = SurfaceUtil.choice(animation_ids)
          if !!@animations[_animId]
            @play @animations[_animId].is, -> resolve()
            return
        if /^stop\,\d+/.test(type)
          _animId = SurfaceUtil.choice(animation_ids)
          if !!@animations[_animId]
            @play @animations[_animId].is, -> resolve()
            return
        if /^alternativestart/.test(type)
          _animId = SurfaceUtil.choice(animation_ids)
          if !!@animations[_animId]
            @play @animations[_animId].is, -> resolve()
            return
        if /^alternativestop/.test(type)
          _animId = SurfaceUtil.choice(animation_ids)
          if !!@animations[_animId]
            @play @animations[_animId].is, -> resolve()
            return
        @layers[anim.is] = pattern
        @render()
        # ex. 100-200 ms wait
        [__, a, b] = (/(\d+)(?:\-(\d+))?/.exec(wait) || ["", "0"])
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
    if !hit then return
    anim = @animations[hit]
    if anim.patterns.length is 0 then return
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
    $(ev.target).css({"cursor": "default"})
    if @isPointerEventsShimed and ev.type is @lastEventType
      @lastEventType = ""
      @isPointerEventsShimed = false
      ev.stopPropagation()
      ev.preventDefault()
      return
    if /^touch/.test(ev.type)
    then {pageX, pageY} = ev.changedTouches[0]
    else {pageX, pageY} = ev
    {left, top} = $(ev.target).offset()
    offsetX = pageX - left
    offsetY = pageY - top
    if Surface.isHit(ev.target, offsetX, offsetY)
      ev.preventDefault()
      detail =
        "type": eventName
        "offsetX": offsetX|0
        "offsetY": offsetY|0
        "wheel": 0
        "scope": @scopeId
        "region": ""
        "button": (if ev.button is 2 then 1 else 0)
      keys = Object.keys(@regions)
      sorted = keys.sort (a, b)-> if a.is > b.is then 1 else -1
      hit = sorted.find (name)=>
        {type, name, left, top, right, bottom, coordinates} = @regions[name]
        switch type
          when "rect"
            (left < offsetX < right and top < offsetY < bottom) or
            (right < offsetX < left and bottom < offsetY < top)
          when "ellipse"
            width = Math.abs(right - left)/2
            height = Math.abs(bottom - top)/2
            Math.pow(offsetX+width/2, 2)/Math.pow(width, 2) +
            Math.pow(offsetY+height/2, 2)/Math.pow(height, 2) < 1
          when "circle"
            Math.pow(offsetX+top, 2)+Math.pow(offsetY+left, 2) /
            Math.pow(right/2, 2) < 1
          when "polygon"
            ptC = {x:offsetX, y:offsetY}
            tuples = coordinates.reduce(((arr, {x, y}, i)->
              arr.push [
                coordinates[i],
                (if !!coordinates[i+1] then coordinates[i+1] else coordinates[0])
              ]
              arr
            ), [])
            mapped = tuples.map ([ptA, ptB])->
              vctA = [ptB.x-ptA.x, ptB.y-ptA.y, 0]
              vctB = [ptC.x-ptA.x, ptC.y-ptA.y, 0]
              # cross product z element
              vctA[0]*vctB[1] - vctA[1]*vctB[0]
            mapped.every((x)-> x<0) or mapped.every((x)-> x>0)
          else
            console.warn @surfaceName, name, @regions[name]
            false
      if !!hit
        ev.stopPropagation() if /^touch/.test(ev.type) # when touching stop drug
        detail["region"] = @regions[hit].name
        $(ev.target).css({"cursor": "pointer"})
      callback($.Event('IkagakaDOMEvent', {detail, bubbles: true }))
    else
      # pointer-events shim
      elm = Surface.isHitBubble(ev.target, ev.pageX, ev.pageY)
      if !elm then return
      if /^mouse/.test(ev.type)
        @isPointerEventsShimed = true
        @lastEventType = ev.type
        ev.preventDefault()
        ev.stopPropagation()
        _ev = document.createEvent("MouseEvent")
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
      else if /^touch/.test(ev.type) and !!document.createTouchList
        @isPointerEventsShimed = true
        @lastEventType = ev.type
        ev.preventDefault()
        ev.stopPropagation()
        touches = document.createTouchList()
        touches[0] = document.createTouch(
          document.body,
          ev.target,
          0, #identifier
          ev.pageX,
          ev.pageY,
          ev.screenX,
          ev.screenY,
          ev.clientX,
          ev.clientY,
          1, #radiusX
          1, #radiusY
          0, #rotationAngle
          1.0); #force
        _ev = document.createEvent("TouchEvent")
        _ev.initTouchEvent(
          touches,#TouchList* touches,
          touches,#TouchList* targetTouches,
          touches,#TouchList* changedTouches,
          ev.type,
          ev.view,#PassRefPtr<AbstractView> view,
          ev.screenX,
          ev.screenY,
          ev.clientX,
          ev.clientY,
          ev.ctrlKey,
          ev.altKey,
          ev.shiftKey,
          ev.metaKey)
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

  @isHitBubble = (element, pageX, pageY)->
    $(element).hide()
    elm = document.elementFromPoint(pageX, pageY)
    if !elm
      $(element).show(); return elm
    unless elm instanceof HTMLCanvasElement
      $(element).show(); return elm
    {top, left} = $(elm).offset()
    if Surface.isHit(elm, pageX-left, pageY-top)
      $(element).show(); return elm
    _elm = Surface.isHitBubble(elm, pageX, pageY)
    $(element).show(); return _elm

if module?.exports?
  module.exports = Surface
else if @Ikagaka?
  @Ikagaka.Surface = Surface
else
  @Surface = Surface
