/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../tsd/NarLoader/NarLoader.d.ts" />
/// <reference path="../tsd/cuttlebone/cuttlebone.d.ts" />

var prmNar = NarLoader.loadFromURL("../nar/mobilemaster.nar");

prmNar.then((nanikaDir)=>{

  QUnit.module("cuttlebone.Shell");
  var shellDir = nanikaDir.getDirectory("shell/master").asArrayBuffer();
  console.dir(shellDir);

  QUnit.test("shell#load", (assert)=> {
    var done1 = assert.async();
    var shell1 = new cuttlebone.Shell(shellDir);
    assert.ok(shell1 instanceof cuttlebone.Shell);
    shell1.load().then((shell2)=>{
      console.dir(shell2);
      assert.ok(shell2 === shell1);
      QUnit.test("shell.descript", (assert)=> {
        assert.ok(shell2.descript["kero.bindgroup20.name"] === "装備,飛行装備");
      });
      QUnit.test("shell.surfaces", (assert)=> {
        assert.ok(shell2.surfaces.charset === "Shift_JIS");
        assert.ok(shell2.surfaces.descript.version === 1);
        assert.ok(shell2.surfaces.surfaces["surface0"].is === 0);
        assert.ok(shell2.surfaces.surfaces["surface0"].filename === "surface0.png");
        assert.ok(shell2.surfaces.surfaces["surface0"].baseSurface instanceof HTMLCanvasElement);
        assert.ok(shell2.surfaces.surfaces["surface0"].regions["collision0"].name === "Head");
        assert.ok(shell2.surfaces.surfaces["surface0"].animations["animation0"].interval === "periodic,5");
      });
      done1();
    });
  });
});


QUnit.module("cuttlebone.Balloon");
prmNar.then((nanikaDir)=>{
  //console.dir(nanikaDir);
});
