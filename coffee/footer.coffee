cuttlebone = {}

cuttlebone["NamedManager"] = NamedManager
cuttlebone["Named"] = Named
cuttlebone["Scope"] = Scope
cuttlebone["Shell"] = Shell
cuttlebone["Surface"] = Surface
cuttlebone["SurfaceUtil"] = SurfaceUtil
cuttlebone["Balloon"] = Balloon
cuttlebone["BalloonSurface"] = BalloonSurface

global["cuttlebone"] = cuttlebone

if module?.exports?
  module.exports = cuttlebone
