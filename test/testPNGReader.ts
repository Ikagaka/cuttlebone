/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../tsd/NarLoader/NarLoader.d.ts" />
/// <reference path="../src/PNGReader.ts" />

var prmNar = NarLoader.loadFromURL("../nar/mobilemaster.nar");

prmNar.then((nanikaDir)=>{

  QUnit.module("cuttlebone.SurfaceCacheManager");

  var shellDir = nanikaDir.getDirectory("shell/master").asArrayBuffer();
  console.log(shellDir);
  console.log(shellDir["surface0.png"]);
  console.log(cuttlebone);
  var reader = new cuttlebone.PNGReader(shellDir["surface0.png"]);
  try{
    var png = reader.parse();
  }catch(err){
    console.error(err, err.stack)
  }
});
