NarLoader.loadFromURL("./mobilemaster.nar").then (nanikaDir)->
  str = nanikaDir.getDirectory("shell").files["master/descript.txt"].toString()
  descript = NarLoader.Descript.parse(str)
  console.log descript
