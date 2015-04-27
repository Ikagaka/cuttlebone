NarLoader.loadFromURL("./mobilemaster.nar").then (nanikaDir)->
  console.dir nanikaDir
  str = nanikaDir.getDirectory("shell").files["master/descript.txt"].toString()
  descript = NarLoader.Descript.parse(str)
  console.dir descript


wait = (ms, callback)-> (ctx)->
  setTimeout((-> callback(ctx)), ms)

Promise.resolve(named)
.then wait 10, (named)-> named.scope(0)
.then wait 0,  (named)-> named.scope().surface(0)
.then wait 0,  (named)-> named.scope().blimp().talk("HELLO WORLD!")
.then wait 0,  (named)-> named.scope().blimp().anchorBegin("AnchorID")
.then wait 0,  (named)-> named.scope().blimp().talk("anchor")
.then wait 0,  (named)-> named.scope().blimp().anchorEnd()
.then wait 0,  (named)-> named.scope().blimp().br()
.then wait 0,  (named)-> named.scope().blimp().talk("<"+"script>alert(1);<"+"/script>")
.then wait 0,  (named)-> named.scope().blimp().br()
.then wait 0,  (named)-> named.scope().blimp().choice("choice", "ChoceID")
.then wait 0,  (named)-> named.scope(1)
.then wait 0,  (named)-> named.scope().surface(10)
.then wait 0,  (named)-> named.scope().blimp().talk("hi.")
.then wait 0,  (named)-> named.scope().blimp().showWait()
.then wait 3000,  (named)-> named.scope().blimp().talk("stop wait")


`function addListener(named){
  named.on("mousedown",       function(ev){ console.log(ev); });
  named.on("mousemove",       function(ev){ console.log(ev); });
  named.on("mouseup",         function(ev){ console.log(ev); });
  named.on("mouseclick",      function(ev){ console.log(ev); });
  named.on("mousedblclick",   function(ev){ console.log(ev); });
  named.on("balloonclick",    function(ev){ console.log(ev); });
  named.on("balloondblclick", function(ev){ console.log(ev); });
  named.on("anchorselect",    function(ev){ console.log(ev); });
  named.on("anchorselectex",  function(ev){ console.log(ev); });
  named.on("raise",           function(ev){ console.log(ev); });
  named.on("choiceselectex",  function(ev){ console.log(ev); });
  named.on("choiceselect",    function(ev){ console.log(ev); });
}`
