/// <reference path="../typings/bluebird/bluebird.d.ts"/>
/// <reference path="../typings/qunit/qunit.d.ts"/>
/// <reference path="../tsd/NarLoader/NarLoader.d.ts" />
/// <reference path="../src/PNGReader.ts" />
/// <reference path="../src/PNG.ts"/>
/// <reference path="../src/SurfaceUtil.ts"/>
/// <reference path="../src/BlobWorker.ts"/>
/// <reference path="../tsd/Uint8ClampedArray/Uint8ClampedArray.d.ts"/>

var prmNar = NarLoader.loadFromURL("../nar/tsubasa.zip");

prmNar.then((nanikaDir)=>{

  QUnit.module("cuttlebone.BlobWorker");

  var shellDir = nanikaDir.getDirectory("shell/master").asArrayBuffer();
  console.log(shellDir);
  /*
  QUnit.test("basic echo", (assert)=> {
    var done = assert.async();
    var worker = new cuttlebone.BlobWorker(function () {
      var on = <cuttlebone.blobWorkerGlobalScopeOn>(<any>self).on; // type hack
      on("echo", (data, reply)=> reply(data) );
    });
    worker.load().then(()=>{
      worker.request<string>("echo", "data").then((data)=>{
        assert.ok(data === "data");
        worker.terminate();
        done();
      });
    });
  });

  var filename = "surface0.png";

  QUnit.test(filename, (assert)=> {
    var done = assert.async();
    var worker = new cuttlebone.BlobWorker(function (_:any[]) {
      var on = <cuttlebone.blobWorkerGlobalScopeOn>(<any>self).on; // type hack
      on("decode", (data, reply)=>{
        cuttlebone.SurfaceUtil.fetchPNGUint8ClampedArrayFromArrayBuffer(data).then((pngdata)=>{
          reply(pngdata, [pngdata.data.buffer]);
        });
      });
    }, [], ["../output/src/SurfaceUtil.js", "../output/src/PNGReader.js", "../output/src/PNG.js", "../bower_components/jszip/dist/jszip.min.js"]);
    worker.load().then(()=>{
      worker.request<{width:number,height:number,data:Uint8ClampedArray}>("decode", shellDir[filename], [shellDir[filename]]).then((pngdata)=>{
        console.log(pngdata);
        var render = new cuttlebone.SurfaceRender(cuttlebone.SurfaceUtil.createCanvas());
        render.initImageData(pngdata.width, pngdata.height, pngdata.data);
        assert.ok(render.cnv.width === pngdata.width);
        assert.ok(render.cnv.height === pngdata.height);
        document.body.appendChild(render.cnv);
        worker.terminate();
        done();
      });
    });
  });
  */

  var pngfilenames = Object.keys(shellDir).filter((filename)=> /\.png$|\.pna$/.test(filename) );

  QUnit.test("pngfilenames", (assert)=> {
    var done = assert.async();
    var workers = [0,1,2].map((i)=>
      new cuttlebone.BlobWorker(function (_:any[]) {
        var on = <cuttlebone.blobWorkerGlobalScopeOn>(<any>self).on; // type hack
        on("decode", (data, reply)=>{
          cuttlebone.SurfaceUtil.fetchPNGUint8ClampedArrayFromArrayBuffer(data[0]).then((pngdata)=>{
            reply(pngdata, [pngdata.data.buffer, data[0]]);
          });
        });
      }, [], ["../output/src/SurfaceUtil.js", "../output/src/PNGReader.js", "../output/src/PNG.js", "../bower_components/jszip/dist/jszip.min.js"]));
    var prms = workers.map((worker)=> worker.load() );
    return Promise.all(prms).then(()=>{
      var _prms = pngfilenames.map((filename, i)=>{
        console.log(i, filename);
        return workers[i%workers.length].request<{width:number,height:number,data:Uint8ClampedArray}>("decode", [shellDir[filename]], [shellDir[filename]]).then((pngdata)=>{
          var render = new cuttlebone.SurfaceRender(cuttlebone.SurfaceUtil.createCanvas());
          render.initImageData(pngdata.width, pngdata.height, pngdata.data);
          return render.cnv;
        });
      });
      return Promise.all(_prms).then((cnvs)=>{
        //cnvs.forEach((cnv)=> document.body.appendChild(cnv));
        workers.forEach((worker)=> worker.terminate() );
        assert.ok(true);
        done();
      });
    });
  });


});
