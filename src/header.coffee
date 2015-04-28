### (C) 2015 Legokichi : Licensed under The MIT License ###

# import thirdparty libraries
global           = ((this || 0).self || global)
Encoding         = global["Encoding"]
NarLoader        = global["NarLoader"]
SurfacesTxt2Yaml = global["SurfacesTxt2Yaml"]
_                = global["_"]
$                = global["Zepto"]

Util =
  convert: (buffer)->
    Encoding.codeToString(Encoding.convert(new Uint8Array(buffer), 'UNICODE', 'AUTO'))

  parseDescript: (text)->
    NarLoader.Descript.parse(text)
