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
    //pngs = pngs.filter((filename)=> /(0500|0501|0701|0702|0704|0707|0730|0731)\.png$/.test(filename) ); // trouble makers
    pngs.forEach(function (filename) {
        QUnit.test(filename, function (assert) {
            var done = assert.async();
            cuttlebone.SurfaceUtil.fetchImageFromArrayBuffer(shellDir[filename]).then(function (img) {
                console.info(filename);
                var cnv = cuttlebone.SurfaceUtil.copy(img);
                var ctx = cnv.getContext("2d");
                var original = ctx.getImageData(0, 0, img.width, cnv.height).data;
                try {
                    var reader = new cuttlebone.PNGReader(shellDir[filename]);
                    var png = reader.parse();
                }
                catch (err) {
                    console.error(filename, reader, err.message, err.stack);
                }
                /*var bitspp = png.colors * png.bitDepth;
                var width = png.width*Math.ceil(bitspp)/8
                //console.log(width);
                //console.log(png.pixels.length, width*png.height, png);
                for (var i=0;png.pixels.length>i;i+=width){
                  var bits = uInt8ArrayToBits(png.pixels.subarray(i, i+width));
                  console.log(bits);
                }*/
                var decoded = png.getUint8ClampedArray();
                assert.ok(original.length === decoded.length);
                var isSame = true;
                for (var j = 0; decoded.length > j; j++) {
                    if (decoded[j] !== original[j]) {
                        if (Math.abs(decoded[j] - original[j]) > 1) {
                            // bit level error
                            console.error(filename, png);
                            console.error(j, j % 4, decoded[j], original[j]);
                            drawOnCanvas(filename, png, shellDir[filename]);
                            isSame = false;
                            break;
                        }
                    }
                }
                assert.ok(isSame);
                done();
            });
        });
    });
    function uInt8ArrayToBits(arr) {
        var result = [];
        for (var i = 0; arr.length > i; i++) {
            result = result.concat(uInt8ToBitArray(arr[i]));
        }
        return result;
    }
    function uInt8ToBitArray(uint8) {
        return (uint8 + 256).toString(2).split("").slice(1).map(Number);
    }
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
/// <reference path="../src/Shell.ts" />
var prmNar = NarLoader.loadFromURL("../nar/mobilemaster.nar");
prmNar.then(function (nanikaDir) {
    QUnit.module("cuttlebone.Shell");
    var shellDir = nanikaDir.getDirectory("shell/master").asArrayBuffer();
    console.dir(shellDir);
    var shell = new cuttlebone.Shell(shellDir);
    console.log(shell);
    QUnit.test("shell#load", function (assert) {
        var done = assert.async();
        shell.load().then(function (shell) {
            assert.ok(true);
            done();
        });
    });
    QUnit.test("shell#hasFile", function (assert) {
        assert.ok(shell.hasFile("surface0.png"));
        assert.ok(shell.hasFile("surface0.PNG"));
        assert.ok(shell.hasFile(".\\SURFACE0.PNG"));
        assert.ok(!shell.hasFile("surface0+png"));
        assert.ok(shell.hasFile("./surface0.png"));
        assert.ok(!shell.hasFile("/surface0/png"));
    });
    /*
    QUnit.test("shell#load", (assert)=> {
      var done1 = assert.async();
      var shell1 = new cuttlebone.Shell(shellDir);
      assert.ok(shell1 instanceof cuttlebone.Shell);
      done1();
  
      shell1.load().then((shell2)=>{
        console.dir(shell2);
        assert.ok(shell2 === shell1);
        QUnit.test("shell.descript", (assert)=> {
          assert.ok(shell2.descript["kero.bindgroup20.name"] === "装備,飛行装備");
        });
        QUnit.test("shell.surfaces", (assert)=> {
          assert.ok(shell2.surfaces.charset === "Shift_JIS");
          assert.ok(shell2.surfaces.descript.version === 1);
        });
        QUnit.test("shell.surfaces.surface0", (assert)=> {
          var srf = shell2.surfaces.surfaces["surface0"];
          assert.ok(srf.is === 0);
          assert.ok(srf.baseSurface instanceof HTMLCanvasElement);
          assert.ok(srf.baseSurface.height === 445);
          assert.ok(srf.baseSurface.width === 182);
          assert.ok(srf.regions["collision0"].name === "Head");
          assert.ok(srf.animations["animation0"].interval === "periodic,5");
        });
        QUnit.test("shell.surfaces.surface2", (assert)=> {
          var srf = shell2.surfaces.surfaces["surface2"];
          assert.ok(srf.is === 2);
          assert.ok(srf.baseSurface instanceof HTMLCanvasElement);
          assert.ok(srf.baseSurface.height = 445);
          assert.ok(srf.baseSurface.width === 182);
          assert.ok(srf.regions["collision10"].name === "Ponytail");
          assert.ok(srf.animations["animation30"].interval === "bind");
        });
        QUnit.test("shell.surfaces.surface10", (assert)=> {
          var srf = shell2.surfaces.surfaces["surface10"];
          assert.ok(srf.is === 10);
          assert.ok(srf.baseSurface instanceof HTMLCanvasElement);
          assert.ok(srf.baseSurface.height === 210);
          assert.ok(srf.baseSurface.width === 230);
          assert.ok(srf.regions["collision0"].name === "Screen");
          assert.ok(srf.animations["animation20"].interval === "bind");
        });
        //QUnit.test("draw surface0", (assert)=> {
        //  var cnv = document.createElement("canvas");
        //  var srf = shell2.attachSurface(cnv, 0, 0);
        //  srf.isRegionVisible = true;
        //  console.dir(srf);
        //  srf.bind(30);
        //  srf.bind(31);
        //  srf.bind(32);
        //  srf.bind(50);
        //  setPictureFrame(assert.test.testName, cnv);
        //  assert.ok(true);
        //});
        QUnit.test("draw surface2", (assert)=> {
          var cnv = document.createElement("canvas");
          var srf = shell2.attachSurface(cnv, 0, 2);
          srf.isRegionVisible = true;
          console.dir(srf);
          srf.render();
          setPictureFrame(assert["test"]["testName"], cnv);
  
          var c = cuttlebone.SurfaceUtil.copy(srf.baseSurface);
          console.log(c, "c")
          document.body.appendChild(c)
          setTimeout(()=>{
            var d = cuttlebone.SurfaceUtil.copy(srf.baseSurface);
            console.log(d, "d")
            document.body.appendChild(d);
          }, 1000);
          assert.ok(true);
        });
        QUnit.test("draw surface10", (assert)=> {
          var cnv = document.createElement("canvas");
          var srf = shell2.attachSurface(cnv, 1, 10);
          srf.isRegionVisible = true;
          srf.render(); // renderされないと表示しないため(\s[10]はアニメーションがない)
          console.dir(srf);
          setPictureFrame(assert.test.testName, cnv);
          assert.ok(true);
        });
        done1();
      });
    });*/
    /*function setPictureFrame(title: string, cnv: HTMLCanvasElement): void {
      cnv.addEventListener("IkagakaDOMEvent", (ev)=> console.log(ev.detail) );
      var fieldset = document.createElement("fieldset");
      var legend = document.createElement("legend");
      legend.appendChild(document.createTextNode(title));
      fieldset.appendChild(cnv);
      fieldset.appendChild(legend);
      fieldset.style.display = "inline-block";
      document.body.appendChild(fieldset);
    }*/
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
