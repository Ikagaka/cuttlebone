/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../tsd/NarLoader/NarLoader.d.ts" />
/// <reference path="../src/Surface.ts" />
var prmNar = NarLoader.loadFromURL("../nar/mobilemaster.nar");
prmNar.then(function (nanikaDir) {
    QUnit.module("cuttlebone.Surface");
    var shellDir = nanikaDir.getDirectory("shell/master").asArrayBuffer();
    QUnit.test("Surface", function (assert) {
        assert.ok(true);
    });
});