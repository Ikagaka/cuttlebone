class NamedManager
  constructor: ->
    console.log $
    @$namedMgr = $("<div />").addClass("namedMgr")
    $style = $("<style scoped />").html(@style)
    @$namedMgr.append($style)
    @element = @$namedMgr[0]
    @namedies = []
    @destructors = []

    do =>
      onmousedown = (ev)=>
        setTimeout((=>
          @$namedMgr.append(ev.currentTarget) ), 300)
      @$namedMgr.on("mousedown", ".named", onmousedown)
      @$namedMgr.on("touchstart", ".named", onmousedown)
      @destructors.push =>
        @$namedMgr.off("mousedown", ".named", onmousedown)
        @$namedMgr.off("touchstart", ".named", onmousedown)

  destructor: ->
    @namedies
      .filter (named)-> named?
      .forEach (named)-> $(named.element).remove()
    @destructors.forEach (destructor)-> destructor()
    @$namedMgr.remove()
    return

  materialize: (shell, balloon)->
    named = new Named(shell, balloon)
    @namedies.push(named)
    @$namedMgr.append(named.element)
    return @namedies.length - 1

  vanish: (namedId)->
    if !@namedies[namedId]? then throw new Error("namedId " + namedId + " is not used yet")
    @namedies[namedId].destructor()
    @namedies[namedId] = null
    return

  named: (namedId)->
    if !@namedies[namedId]? then throw new Error("namedId " + namedId + " is not used yet")
    return @namedies[namedId]

  style: """
    .scope {
      position: absolute;
      pointer-events: none;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    .surface {
    }
    .surfaceCanvas {
      pointer-events: auto;
    }
    .blimp {
      position: absolute;
      top: 0px;
      left: 0px;
      pointer-events: auto;
    }
    .blimpCanvas {
      position: absolute;
      top: 0px;
      left: 0px;
    }
    .blimpText {
      position: absolute;
      top: 0px;
      left: 0px;
      overflow-y: scroll;
      white-space: pre-wrap;
      word-wrap: break-all;
    }
    .blimpText a {
      cursor: pointer;
    }

    @keyframes blink {
      75% { opacity: 0.0; }
    }
    .blink {
      animation: blink 1s step-end infinite;
    }
  """
