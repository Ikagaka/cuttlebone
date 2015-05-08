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
    pngs.forEach(function (filename) {
        try {
            var reader = new cuttlebone.PNGReader(shellDir[filename]);
            var png = reader.parse();
            drawOnCanvas(filename, png, shellDir[filename]);
        }
        catch (err) {
            console.log(filename, reader);
            console.error(err, err.stack);
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
