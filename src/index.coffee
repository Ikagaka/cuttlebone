{Shell, Surface, SurfaceUtil, SurfaceRender} = require("ikagaka.shell.js")
{Balloon, Blimp} = require("ikagaka.balloon.js")
{NamedManager, Named, Scope} = require("ikagaka.namedmanager.js")

Named.prototype.load = ->
  console.log @
  @on "mouse", (ev)=>
    console.log ev
    @emit(ev.type, ev)
  Promise.resolve(@)


exports.Balloon = Balloon
exports.Blimp = Blimp
exports.Shell = Shell
exports.Surface = Surface
exports.SurfaceUtil = SurfaceUtil
exports.SurfaceRender = SurfaceRender
exports.NamedManager = NamedManager
exports.Named = Named
exports.Scope = Scope
