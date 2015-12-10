{Shell, Surface, SurfaceUtil, SurfaceRender, version: s_version} = require("ikagaka.shell.js")
{Balloon, Blimp, version: b_version} = require("ikagaka.balloon.js")
{NamedManager, Named, Scope, version: n_version} = require("ikagaka.namedmanager.js")

exports.versions = {
  Shell: s_version,
  Balloon: b_version,
  NamedManager: n_version
};

exports.Balloon = Balloon
exports.Blimp = Blimp
exports.Shell = Shell
exports.Surface = Surface
exports.SurfaceUtil = SurfaceUtil
exports.SurfaceRender = SurfaceRender
exports.NamedManager = NamedManager
exports.Named = Named
exports.Scope = Scope
