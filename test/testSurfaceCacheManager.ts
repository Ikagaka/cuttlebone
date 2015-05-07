/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../tsd/NarLoader/NarLoader.d.ts" />
/// <reference path="../tsd/SurfacesTxt2Yaml/SurfacesTxt2Yaml.d.ts"/>
/// <reference path="../tsd/encoding-japanese/encoding.d.ts"/>
/// <reference path="../src/SurfaceCacheManager.ts" />

var prmNar = NarLoader.loadFromURL("../nar/mobilemaster.nar");

prmNar.then((nanikaDir)=>{

  QUnit.module("cuttlebone.SurfaceCacheManager");
  var shellDir = nanikaDir.getDirectory("shell/master").asArrayBuffer();
  console.log(shellDir);
  var filenames = Object.keys(shellDir).filter((filename)=> /surfaces\S*\.txt$/.test(filename));
  console.log(filenames);
  var cated = filenames.reduce((str ,filename)=>{
    return str + Encoding.codeToString(Encoding.convert(new Uint8Array(shellDir[filename]), 'UNICODE', 'AUTO'));
  }, "");
  var surfaces = SurfacesTxt2Yaml.txt_to_data(cated, {compatible: 'ssp-lazy'});
  console.log(surfaces);
  var srfMgr = new cuttlebone.SurfaceCacheManager(surfaces, shellDir);
  console.log(srfMgr);

  QUnit.test("SurfaceCacheManager#isCached", (assert)=> {
    assert.ok(srfMgr.isCached(0) === false);
  });

  QUnit.test("SurfaceCacheManager#getSurfaceFilename", (assert)=> {
    assert.ok(srfMgr.getSurfaceFilename(0) === "surface0.png");
  });

  QUnit.test("SurfaceCacheManager#getPNAFilename", (assert)=> {
    assert.ok(srfMgr.getPNAFilename(srfMgr.getSurfaceFilename(731)) === "surface0731.pna");
  });
  QUnit.test("SurfaceCacheManager#getSurfaceDefinition", (assert)=> {
    assert.ok(srfMgr.getSurfaceDefinition(0).is === 0);
  });
});
