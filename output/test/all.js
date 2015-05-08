/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../tsd/NarLoader/NarLoader.d.ts" />
/// <reference path="../src/PNGReader.ts" />
var prmNar = NarLoader.loadFromURL("../nar/mobilemaster.nar");
prmNar.then(function (nanikaDir) {
    QUnit.module("cuttlebone.SurfaceCacheManager");
    var shellDir = nanikaDir.getDirectory("shell/master").asArrayBuffer();
    console.log(shellDir);
    console.log(shellDir["surface0.png"]);
    console.log(cuttlebone);
    var reader = new cuttlebone.PNGReader(shellDir["surface0.png"]);
    try {
        var png = reader.parse();
    }
    catch (err) {
        console.error(err, err.stack);
    }
});
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
/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../tsd/NarLoader/NarLoader.d.ts" />
/// <reference path="../tsd/SurfacesTxt2Yaml/SurfacesTxt2Yaml.d.ts"/>
/// <reference path="../tsd/encoding-japanese/encoding.d.ts"/>
/// <reference path="../src/SurfaceCacheManager.ts" />
var prmNar = NarLoader.loadFromURL("../nar/mobilemaster.nar");
prmNar.then(function (nanikaDir) {
    QUnit.module("cuttlebone.SurfaceCacheManager");
    var shellDir = nanikaDir.getDirectory("shell/master").asArrayBuffer();
    console.log(shellDir);
    var filenames = Object.keys(shellDir).filter(function (filename) { return /surfaces\S*\.txt$/.test(filename); });
    console.log(filenames);
    var cated = filenames.reduce(function (str, filename) {
        return str + Encoding.codeToString(Encoding.convert(new Uint8Array(shellDir[filename]), 'UNICODE', 'AUTO'));
    }, "");
    var surfaces = SurfacesTxt2Yaml.txt_to_data(cated, { compatible: 'ssp-lazy' });
    console.log(surfaces);
    var srfMgr = new cuttlebone.SurfaceCacheManager(surfaces, shellDir);
    console.log(srfMgr);
    QUnit.test("SurfaceCacheManager#isCached", function (assert) {
        assert.ok(srfMgr.isCached(0) === false);
    });
    QUnit.test("SurfaceCacheManager#getSurfaceFilename", function (assert) {
        assert.ok(srfMgr.getSurfaceFilename(0) === "surface0.png");
    });
    QUnit.test("SurfaceCacheManager#getPNAFilename", function (assert) {
        var filename = srfMgr.getSurfaceFilename(731);
        assert.ok(srfMgr.getPNAFilename(filename) === "surface0731.pna");
    });
    QUnit.test("SurfaceCacheManager#getSurfaceDefinition", function (assert) {
        assert.ok(srfMgr.getSurfaceDefinition(0).is === 0);
    });
});
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
/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../tsd/NarLoader/NarLoader.d.ts" />
/// <reference path="../src/SurfaceUtil.ts" />
var prmNar = NarLoader.loadFromURL("../nar/mobilemaster.nar");
prmNar.then(function (nanikaDir) {
    QUnit.module("cuttlebone.SurfaceUtil");
    var shellDir = nanikaDir.getDirectory("shell/master").asArrayBuffer();
    QUnit.test("Surface", function (assert) {
        assert.ok(true);
    });
});
