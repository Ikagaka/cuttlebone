/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../tsd/NarLoader/NarLoader.d.ts" />
/// <reference path="../tsd/cuttlebone/cuttlebone.d.ts" />

QUnit.module("cuttlebone.Shell");

QUnit.test("load shell", function(assert) {
  var done1 = assert.async();
  NarLoader.loadFromURL("../nar/mobilemaster.nar").then((nanikaDir)=>{
    var shellDir = nanikaDir.getDirectory("shell/master").asArrayBuffer();
    var shell1 = new cuttlebone.Shell(shellDir);
    assert.ok(shell1 instanceof cuttlebone.Shell);
    shell1.load().then((shell2)=>{
      assert.ok(shell2 === shell1);
      console.dir(shell2);
      done1();

      QUnit.test("parse descript", function(assert) {
        assert.ok(shell2.descript["kero.bindgroup20.name"] === "装備,飛行装備");
      });
      QUnit.test("parse surfaces and load surface*.png", function(assert) {
        assert.ok(shell2.surfaces.charset === "Shift_JIS");
        assert.ok(shell2.surfaces.descript.version === 1);
      });
    })
  });
});

QUnit.module("cuttlebone.Balloon");
