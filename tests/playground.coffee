nmdmgr = null
balloonDir = null

$ ->
  $("#nar").change (ev)->
    loader = new Nar.Loader()
    file = ev.target.files[0]
    NarLoader.loadFromBlob(file).then(onNarLoad)
    $(this).val(null)

  NarLoader.loadFromURL("../nar/origin.nar").then (nanikaDir)->
    console.log balloonDir = nanikaDir.asArrayBuffer()
    console.log nmdmgr = new Ikagaka.Shell.NamedManager()
    $(nmdmgr.element).appendTo("body")
    NarLoader.loadFromURL("../nar/mobilemaster.nar").then(onNarLoad)

onNarLoad = (nanikaDir)->
  console.log shellDir = nanikaDir.getDirectory("shell/master").asArrayBuffer()
  console.log shell = new Ikagaka.Shell.Shell(shellDir)
  console.log balloon = new Ikagaka.Shell.Balloon(balloonDir)
  Promise.all([shell.load(), balloon.load()])
  .then ([shell, balloon])->
    console.log shell, balloon
    console.log hwnd = nmdmgr.materialize(shell, balloon)
    console.log named = nmdmgr.named(hwnd)
    wait = (ms, callback)-> (ctx)->
      new Promise (resolve)->
        setTimeout((-> callback(ctx); resolve(ctx)), ms)

    named.on("mousedown",       (ev)-> console.log(ev))
    named.on("mousemove",       (ev)-> console.log(ev))
    named.on("mouseup",         (ev)-> console.log(ev))
    named.on("mouseclick",      (ev)-> console.log(ev))
    named.on("mousedblclick",   (ev)-> console.log(ev))
    named.on("balloonclick",    (ev)-> console.log(ev))
    named.on("balloondblclick", (ev)-> console.log(ev))
    named.on("anchorselect",    (ev)-> console.log(ev))
    named.on("anchorselectex",  (ev)-> console.log(ev))
    named.on("raise",           (ev)-> console.log(ev))
    named.on("choiceselectex",  (ev)-> console.log(ev))
    named.on("choiceselect",    (ev)-> console.log(ev))
    named.load()
    .then wait 0, (named)-> named.scope(0)
    .then wait 0, (named)-> named.scope().surface(0)
    .then wait 0, (named)-> named.scope(1)
    .then wait 0, (named)-> named.scope().surface(10)
    .then wait 0, (named)-> named.scope(0)
    .then wait 0, (named)-> named.scope().blimp(0)
    .then wait 80, (named)-> named.scope().blimp().talk("H")
    .then wait 80, (named)-> named.scope().blimp().talk("e")
    .then wait 80, (named)-> named.scope().blimp().talk("l")
    .then wait 80, (named)-> named.scope().blimp().talk("l")
    .then wait 80, (named)-> named.scope().blimp().talk("o")
    .then wait 80, (named)-> named.scope().blimp().talk(",")
    .then wait 80, (named)-> named.scope().blimp().talk("w")
    .then wait 80, (named)-> named.scope().blimp().talk("o")
    .then wait 80, (named)-> named.scope().blimp().talk("r")
    .then wait 80, (named)-> named.scope().blimp().talk("l")
    .then wait 80, (named)-> named.scope().blimp().talk("d")
    .then wait 80, (named)-> named.scope().blimp().talk("!")
    .then wait 160, (named)-> named.scope(1)
    .then wait 0, (named)-> named.scope().blimp().anchorBegin("AnchorID")
    .then wait 0, (named)-> named.scope().blimp().talk("anchor")
    .then wait 0, (named)-> named.scope().blimp().anchorEnd()
    .then wait 0, (named)-> named.scope().blimp().br()
    .then wait 0, (named)-> named.scope().blimp().talk("<"+"script>alert(1);<"+"/script>")
    .then wait 0, (named)-> named.scope().blimp().br()
    .then wait 0, (named)-> named.scope().blimp().choice("choice", "ChoceID")
    .then wait 0, (named)-> named.scope().blimp().talk("hi.")
    .then wait 0, (named)-> named.scope().blimp().showWait()
    .then wait 3000, (named)-> named.scope().blimp().talk("stop wait")
  .catch (err)-> console.error err, err.stack
