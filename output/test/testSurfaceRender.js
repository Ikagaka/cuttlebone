/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../tsd/NarLoader/NarLoader.d.ts" />
/// <reference path="../src/SurfaceRender.ts" />
var prmNar = NarLoader.loadFromURL("../nar/mobilemaster.nar");
prmNar.then(function (nanikaDir) {
    QUnit.module("cuttlebone.SurfaceRender");
    var shellDir = nanikaDir.getDirectory("shell/master").asArrayBuffer();
    QUnit.test("SurfaceRender", function (assert) {
        assert.ok(true);
    });
});
