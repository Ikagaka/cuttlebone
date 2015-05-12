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
var prmNar = NarLoader.loadFromURL("../nar/mobilemaster.zip");
prmNar.then(function (nanikaDir) {
    QUnit.module("cuttlebone.Shell");
    var shellDir = nanikaDir.getDirectory("shell/master").asArrayBuffer();
    console.dir(shellDir);
    var shell = new cuttlebone.Shell(shellDir);
    QUnit.test("shell#load", function (assert) {
        var done = assert.async();
        shell.load().then(function (shell) {
            assert.ok(true);
            console.log(shell);
            done();
        }).catch(function (err) {
            console.error(err, err.stack, shell);
            assert.ok(false);
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
    QUnit.test("shell.descript", function (assert) {
        assert.ok(shell.descript["kero.bindgroup20.name"] === "装備,飛行装備");
    });
    QUnit.test("shell.surfaces", function (assert) {
        assert.ok(shell.surfaces.charset === "Shift_JIS");
        assert.ok(shell.surfaces.descript.version === 1);
    });
    QUnit.test("shell#attachSurface", function (assert) {
        var cnv = document.createElement("canvas");
        document.body.appendChild(cnv);
        var srf = shell.attachSurface(cnv, 0, 3);
        assert.ok(srf.surfaceId === 3);
        assert.ok(srf.element instanceof HTMLCanvasElement);
        assert.ok(srf.element.height === 445);
        assert.ok(srf.element.width === 182);
        console.log(srf.surfaceTreeNode.collisions);
        assert.ok(srf.surfaceTreeNode.collisions[0].name === "Head");
        assert.ok(srf.surfaceTreeNode.animations[0].interval === "periodic,5");
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
  
        QUnit.test("shell.surfaces.surface2", (assert)=> {
          var srf = shell.surfaces.surfaces["surface2"];
          assert.ok(srf.is === 2);
          assert.ok(srf.baseSurface instanceof HTMLCanvasElement);
          assert.ok(srf.baseSurface.height = 445);
          assert.ok(srf.baseSurface.width === 182);
          assert.ok(srf.regions["collision10"].name === "Ponytail");
          assert.ok(srf.animations["animation30"].interval === "bind");
        });
  
        QUnit.test("shell.surfaces.surface10", (assert)=> {
          var srf = shell.surfaces.surfaces["surface10"];
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
