class SakuraScriptPlayer

  constructor: (@named)->
    @playing = false
    @breakTid = 0
    @timeCritical = false
    @wait_default = 80
    @timeout_default = 15000
    @choicetimeout_default = 30000
    @continue = null
    @named.on "balloonclick", (ev)=>
      if !!@continue
        fn = @continue
        @continue = null
        @named.scope(0)
        fn()



  play: (script, listener={})->
    if @playing and @timeCritical # called when time critical section
      @trigger_all 'reject', listener
      return
    @break()
    @playing = true
    @timeCritical = false

    splitargs = (str) ->
      str
      .replace /"((?:\\\\|\\"|[^"])*)"/g, (all, quoted) -> quoted.replace(/,/g,'\0')
      .split /\s*\,\s*/
      .map (arg) -> arg.replace /\0/g, ','
    talk = (a)=>
      @named.scope().blimp().talk(a)
      @named.scope().surface().talk()
    talkRaw = (a)=>
      @named.scope().blimp().talkRaw(a)
      @named.scope().surface().talk()
    tags = [
      {re: /^\\[h0]/, match: (group, state) -> @named.scope(0)}
      {re: /^\\[u1]/, match: (group, state) -> @named.scope(1)}
      {re: /^\\p\[(\d+)\]/, match: (group, state) -> @named.scope(Number group[1])}
      {re: /^\\p(\d)/, match: (group, state) -> @named.scope(Number group[1])}
      {re: /^\\s(\d)/, match: (group, state) -> @named.scope().surface(Number group[1])}
      {re: /^\\s\[([^\]]+)\]/, match: (group, state) -> @named.scope().surface(if isNaN(group[1]) then group[1] else Number group[1])}
      {re: /^\\b(\d)/, match: (group, state) -> @named.scope().blimp(Number group[1])}
      {re: /^\\b\[([^\]]+)\]/, match: (group, state) -> @named.scope().blimp(Number group[1])}
      {re: /^\\i(\d)/, match: (group, state) -> @named.scope().surface().play(Number group[1])}
      {re: /^\\i\[(\d+)\]/, match: (group, state) -> @named.scope().surface().play(Number group[1])}
      {re: /^\\w(\d)/, match: (group, state) -> state.wait = Number(group[1])*100}
      {re: /^\\\_w\[(\d+)\]/, match: (group, state) -> state.wait = Number(group[1])}
      {re: /^\\\_q/, match: (group, state) -> state.quick = !state.quick}
      {re: /^\\\_s\[([^\]]+)\]/, match: (group, state) -> state.synchronized = if state.synchronized then false else splitargs(group[1]).map (n) -> Number(n)}
      {re: /^\\\_s/, match: (group, state) -> state.synchronized = if state.synchronized then false else [0, 1]}
      {re: /^\\t/, match: (group, state) -> @timeCritical = true}
      {re: /^\\x/, match: (group, state) -> state.click_wait = true; @named.scope(0).blimp().showWait() }
      {re: /^\\\!\[\s*set\s*,\s*choicetimeout\s*,\s*(-?\d+)\s*\]/, match: (group, state) -> state.choicetimeout = Number group[1]}
      {re: /^\\\*/, match: (group, state) -> state.choicetimeout = -1}
      {re: /^\\q\[((?:\\\\|\\\]|[^\]])+)\]/, match: (group, state) -> state.has_choice = true; blimp = @named.scope().blimp(); blimp.choice.apply(blimp, splitargs(group[1]))}
      {re: /^\\__q\[((?:\\\\|\\\]|[^\]])+)\]/, match: (group, state) -> state.has_choice = true; blimp = @named.scope().blimp(); blimp.choiceBegin.apply(blimp, splitargs(group[1]))}
      {re: /^\\__q/, match: (group, state) -> @named.scope().blimp().choiceEnd()}
      {re: /^\\q(?:\d+)?\[((?:\\\\|\\\]|[^\]])+)\]\[((?:\\\\|\\\]|[^\]])+)\]/, match: (group, state) -> state.has_choice = true; @named.scope().blimp().choice(group[2], group[1]); @named.scope().blimp().br()}
      {re: /^\\_a\[((?:\\\\|\\\]|[^\]])+)\]/, match: (group, state) -> blimp = @named.scope().blimp(); blimp.anchorBegin.apply(blimp, splitargs(group[1]))}
      {re: /^\\_a/, match: (group, state) -> @named.scope().blimp().anchorEnd()}
      {re: /^\\n\[half\]/, match: (group, state) -> @named.scope().blimp().br(0.5)}
      {re: /^\\n\[(\d+)\]/, match: (group, state) -> @named.scope().blimp().br(group[1] / 100)}
      {re: /^\\n/, match: (group, state) -> @named.scope().blimp().br()}
      {re: /^\\_l\[([^\]]+)\]/, match: (group, state) -> blimp = @named.scope().blimp(); blimp.location.apply(blimp, splitargs(group[1]))}
      {re: /^\\f\[([^\]]+)\]/, match: (group, state) -> blimp = @named.scope().blimp(); blimp.font.apply(blimp, splitargs(group[1]))}
      {re: /^\\c/, match: (group, state) -> @named.scope().blimp().clear()}
      {re: /^\\[ez]/, match: (group, state) -> @playing = false; @named.scopes.forEach (scope) -> scope.surface().yenE()}
      {re: /^\\-/, match: (group, state) -> @playing = false; @named.scopes.forEach((scope) -> scope.surface().yenE()); @trigger_all('script:halt', listener)}
      {re: /^\\\\/, match: (group, state) -> talk("\\")}
      {re: /^\\\!\[\s*open\s*,\s*communicatebox\s*\]/, match: (group, state) -> setTimeout((=> @named.openCommunicateBox() ), 2000)}
      {re: /^\\__c/, match: (group, state) -> setTimeout((=> @named.openCommunicateBox() ), 2000)}
      {re: /^\\\!\[\s*open\s*,\s*inputbox\s*,((?:\\\\|\\\]|[^\]])+)\]/, match: (group, state) -> setTimeout((=> @named.openInputBox(splitargs(group[1])[0]) ), 2000)}
      {re: /^\\\!\[\s*raise\s*,\s*((?:\\\\|\\\]|[^\]])+)\]/, match: (group, state) -> setTimeout((=> @trigger_all('script:raise', listener, splitargs(group[1])) ), 0)}
      {re: /^\\!\[\*\]/, match: (group, state) -> @named.scope().blimp().marker()}
      {re: /^\\_u\[([A-Fa-fXx0-9]+)\]/, match: (group, state) -> state.wait = @wait_default; talkRaw('&#'+Number(group[1])+';')}
      {re: /^\\_m\[([A-Fa-fXx0-9]+)\]/, match: (group, state) -> state.wait = @wait_default; talkRaw('&#'+Number(group[1])+';')}
      {re: /^\\&\[([A-Za-z0-9]+)\]/, match: (group, state) -> state.wait = @wait_default; talkRaw('&'+group[1]+';')}
      {re: /^\\[45Cx67+v8]/, match: (group, state) -> talk(group[0])} # not implemented quick
      {re: /^\\_[ns+V]/, match: (group, state) -> talk(group[0])} # not implemented quick
      {re: /^\\__[qtc]/, match: (group, state) -> talk(group[0])} # not implemented quick
      {re: /^\\[f8j]\[.*?\]/, match: (group, state) -> talk(group[0])} # not implemented quick
      {re: /^\\_[bl!?sv]\[.*?\]/, match: (group, state) -> talk(group[0])} # not implemented quick
      {re: /^\\__[wq]\[.*?\]/, match: (group, state) -> talk(group[0])} # not implemented quick
      {re: /^\\!\[.*?\]/, match: (group, state) -> talk(group[0])} # not implemented quick
      {re: /^\s/, match: (group, state) -> talk(group[0])}
      {re: /^./, match: (group, state) -> state.wait = @wait_default; if not state.synchronized then talk(group[0]) else state.synchronized.forEach (scopeid) => @named.scopes[scopeid]?.blimp().talk(group[0])}
    ]

    state =
      quick: false
      synchronized: false
      has_choice: false
      click_wait: false

    @named.scopes.forEach (scope) ->
      scope.blimp(0) # clear balloon id
      scope.blimp(-1) # hide init

    do recur = =>
      if script.length is 0
        @playing = false
      if not @playing
        @trigger_all 'finish', listener
        if state.has_choice
          timeout = if state.choicetimeout? then state.choicetimeout else @choicetimeout_default
        else
          timeout = @timeout_default
        if timeout > 0
          @breakTid = setTimeout (=> @break()), timeout
        return
      state.wait = 0
      tag = tags.filter((tag)-> tag.re.test(script))[0]
      if tag?
        script = script.replace tag.re, (group..., offset, all) =>
          tag.match.call @, group, state # do func
          return '' # delete matched
      if state.click_wait
        @continue = -> state.click_wait = false; recur()
      else
        @breakTid = setTimeout recur, if state.quick then 0 else state.wait
    return

  break: ->
    @playing = false
    @timeCritical = false
    clearTimeout(@breakTid)
    @named.scopes.forEach (scope)->
      scope.blimp(-1).clear()
    return

  on: (event, callback) ->
    unless event? and callback? then throw Error 'on() event and callback required'
    unless @listener?
      @listener = {}
    unless @listener[event]?
      @listener[event] = []
    if -1 == @listener[event].indexOf(callback)
      @listener[event].push(callback)
    @

  off: (event, callback) -> # undefined means any
    if event? and callback?
      if @listener[event]?
        index = @listener[event].indexOf(callback)
        if index != -1
          @listener[event].splice(index, 1)
    else if event?
      delete @listener[event]
    else if callback?
      for event of @listener
        index = @listener[event].indexOf(callback)
        if index != -1
          @listener[event].splice(index, 1)
    else
      delete @listener
    @

  trigger: (event, args...) ->
    if @listener?[event]?
      for callback in @listener[event]
        setTimeout (-> callback.apply(@, args)), 0
    @

  trigger_local: (event, listener, args...) ->
    if listener?[event]?
      setTimeout (-> listener[event].apply(@, args)), 0
    @

  trigger_all: (event, listener, args...) ->
    @trigger_local.apply(@, [event, listener].concat(args))
    @trigger.apply(@, [event].concat(args))
    @

module.exports = SakuraScriptPlayer
