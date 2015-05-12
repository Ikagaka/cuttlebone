/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../tsd/NarLoader/NarLoader.d.ts" />
/// <reference path="../src/Shell.ts" />

var prmNar = NarLoader.loadFromURL("../nar/mobilemaster.nar");

prmNar.then((nanikaDir)=>{

  QUnit.module("cuttlebone.Shell");

  var shellDir = nanikaDir.getDirectory("shell/master").asArrayBuffer();
  console.dir(shellDir);

  var shell = new cuttlebone.Shell(shellDir);
  console.log(shell);

  QUnit.test("shell#load", (assert)=> {
    var done = assert.async();
    shell.load().then((shell)=>{
      assert.ok(true);
      done();
    });
  });

  QUnit.test("shell#hasFile", (assert)=> {
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
