/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../tsd/NarLoader/NarLoader.d.ts" />
/// <reference path="../tsd/cuttlebone/cuttlebone.d.ts" />
var prmNar = NarLoader.loadFromURL("../nar/mobilemaster.nar");
prmNar.then(function (nanikaDir) {
    QUnit.module("cuttlebone.Shell");
    var shellDir = nanikaDir.getDirectory("shell/master").asArrayBuffer();
    console.dir(shellDir);
    QUnit.test("shell#load", function (assert) {
        var done1 = assert.async();
        var shell1 = new cuttlebone.Shell(shellDir);
        assert.ok(shell1 instanceof cuttlebone.Shell);
        shell1.load().then(function (shell2) {
            console.dir(shell2);
            assert.ok(shell2 === shell1);
            QUnit.test("shell.descript", function (assert) {
                assert.ok(shell2.descript["kero.bindgroup20.name"] === "装備,飛行装備");
            });
            QUnit.test("shell.surfaces", function (assert) {
                assert.ok(shell2.surfaces.charset === "Shift_JIS");
                assert.ok(shell2.surfaces.descript.version === 1);
            });
            QUnit.test("shell.surfaces.surface0", function (assert) {
                var srf = shell2.surfaces.surfaces["surface0"];
                assert.ok(srf.is === 0);
                assert.ok(srf.baseSurface instanceof HTMLCanvasElement);
                assert.ok(srf.baseSurface.height === 445);
                assert.ok(srf.baseSurface.width === 182);
                assert.ok(srf.regions["collision0"].name === "Head");
                assert.ok(srf.animations["animation0"].interval === "periodic,5");
            });
            QUnit.test("shell.surfaces.surface2", function (assert) {
                var srf = shell2.surfaces.surfaces["surface2"];
                assert.ok(srf.is === 2);
                assert.ok(srf.baseSurface instanceof HTMLCanvasElement);
                assert.ok(srf.baseSurface.height = 445);
                assert.ok(srf.baseSurface.width === 182);
                assert.ok(srf.regions["collision10"].name === "Ponytail");
                assert.ok(srf.animations["animation30"].interval === "bind");
            });
            QUnit.test("shell.surfaces.surface10", function (assert) {
                var srf = shell2.surfaces.surfaces["surface10"];
                assert.ok(srf.is === 10);
                assert.ok(srf.baseSurface instanceof HTMLCanvasElement);
                assert.ok(srf.baseSurface.height === 210);
                assert.ok(srf.baseSurface.width === 230);
                assert.ok(srf.regions["collision0"].name === "Screen");
                assert.ok(srf.animations["animation20"].interval === "bind");
            });
            QUnit.test("draw surface0", function (assert) {
                var cnv = document.createElement("canvas");
                var srf = shell2.attachSurface(cnv, 0, 0);
                srf.isRegionVisible = true;
                console.dir(srf);
                srf.bind(30);
                srf.bind(31);
                srf.bind(32);
                srf.bind(50);
                setPictureFrame(assert.test.testName, cnv);
                assert.ok(true);
            });
            QUnit.test("draw surface10", function (assert) {
                var cnv = document.createElement("canvas");
                var srf = shell2.attachSurface(cnv, 1, 10);
                srf.isRegionVisible = true;
                console.dir(srf);
                setPictureFrame(assert.test.testName, cnv);
                assert.ok(true);
            });
            done1();
        });
    });
    function setPictureFrame(title, cnv) {
        var fieldset = document.createElement("fieldset");
        var legend = document.createElement("legend");
        legend.appendChild(document.createTextNode(title));
        fieldset.appendChild(cnv);
        fieldset.appendChild(legend);
        fieldset.style.display = "inline-block";
        document.body.appendChild(fieldset);
    }
});
QUnit.module("cuttlebone.Balloon");
prmNar.then(function (nanikaDir) {
    //console.dir(nanikaDir);
});
