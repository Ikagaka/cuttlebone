/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../tsd/NarLoader/NarLoader.d.ts" />
/// <reference path="../src/PNGReader.ts" />
/// <reference path="../src/SurfaceUtil.ts"/>
var prmNar = NarLoader.loadFromURL("../nar/mobilemaster.nar");
prmNar.then(function (nanikaDir) {
    QUnit.module("cuttlebone.SurfaceCacheManager");
    var shellDir = nanikaDir.getDirectory("shell/master").asArrayBuffer();
    console.log(shellDir);
    var pngs = Object.keys(shellDir).filter(function (filename) { return /\.png$/.test(filename); });
    pngs = pngs.filter(function (filename) { return /(0500|0501|0702|0730|0731)\.png$/.test(filename); });
    pngs.forEach(function (filename) {
        console.info(filename);
        try {
            var reader = new cuttlebone.PNGReader(shellDir[filename]);
            var png = reader.parse();
            for (var i = 0; png.pixels.length < i; i += png.width * Math.ceil(png.colors * png.bitDepth / 8)) {
                console.log(png.pixels.subarray(i, i + png.width * Math.ceil(png.colors * png.bitDepth / 8)));
            }
            drawOnCanvas(filename, png, shellDir[filename]);
        }
        catch (err) {
            console.error(filename, reader, err.message);
        }
    });
    function drawOnCanvas(filename, png, buf) {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        var canvasWidth = canvas.width = png.width;
        var canvasHeight = canvas.height = png.height;
        var canvasData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
        var i = 0;
        var width = Math.min(png.width, canvasWidth);
        var height = Math.min(png.height, canvasHeight);
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var colors = png.getPixel(x, y);
                canvasData.data[i++] = colors[0];
                canvasData.data[i++] = colors[1];
                canvasData.data[i++] = colors[2];
                canvasData.data[i++] = colors[3];
            }
            // move index to the next line
            var d = canvasWidth - width;
            if (d > 0)
                i += d * 4;
        }
        ctx.putImageData(canvasData, 0, 0);
        var fieldset = document.createElement("fieldset");
        var legend = document.createElement("legend");
        legend.appendChild(document.createTextNode(filename));
        fieldset.appendChild(canvas);
        canvas.style.cssFloat = "left";
        cuttlebone.SurfaceUtil.fetchImageFromArrayBuffer(buf).then(function (img) {
            fieldset.appendChild(img);
            img.style.cssFloat = "left";
        });
        fieldset.appendChild(legend);
        fieldset.style.display = "inline-block";
        fieldset.style.cssFloat = "left";
        document.body.appendChild(fieldset);
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
