var prmNar = NarLoader.loadFromURL('../nar/mobilemaster.nar');
prmNar.then(function (nanikaDir) {
    QUnit.module('cuttlebone.Shell');
    var shellDir = nanikaDir.getDirectory('shell/master').asArrayBuffer();
    console.dir(shellDir);
    QUnit.test('shell#load', function (assert) {
        var done1 = assert.async();
        var shell1 = new cuttlebone.Shell(shellDir);
        assert.ok(assert._expr(assert._capt(assert._capt(shell1, 'arguments/0/left') instanceof assert._capt(assert._capt(cuttlebone, 'arguments/0/right/object').Shell, 'arguments/0/right'), 'arguments/0'), {
            content: 'assert.ok(shell1 instanceof cuttlebone.Shell)',
            filepath: 'test/unit.js',
            line: 12
        }));
        shell1.load().then(function (shell2) {
            console.dir(shell2);
            assert.ok(assert._expr(assert._capt(assert._capt(shell2, 'arguments/0/left') === assert._capt(shell1, 'arguments/0/right'), 'arguments/0'), {
                content: 'assert.ok(shell2 === shell1)',
                filepath: 'test/unit.js',
                line: 15
            }));
            QUnit.test('shell.descript', function (assert) {
                assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(assert._capt(shell2, 'arguments/0/left/object/object').descript, 'arguments/0/left/object')['kero.bindgroup20.name'], 'arguments/0/left') === '\u88C5\u5099,\u98DB\u884C\u88C5\u5099', 'arguments/0'), {
                    content: 'assert.ok(shell2.descript["kero.bindgroup20.name"] === "\u88C5\u5099,\u98DB\u884C\u88C5\u5099")',
                    filepath: 'test/unit.js',
                    line: 17
                }));
            });
            QUnit.test('shell.surfaces', function (assert) {
                assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(assert._capt(shell2, 'arguments/0/left/object/object').surfaces, 'arguments/0/left/object').charset, 'arguments/0/left') === 'Shift_JIS', 'arguments/0'), {
                    content: 'assert.ok(shell2.surfaces.charset === "Shift_JIS")',
                    filepath: 'test/unit.js',
                    line: 20
                }));
                assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(assert._capt(assert._capt(shell2, 'arguments/0/left/object/object/object').surfaces, 'arguments/0/left/object/object').descript, 'arguments/0/left/object').version, 'arguments/0/left') === 1, 'arguments/0'), {
                    content: 'assert.ok(shell2.surfaces.descript.version === 1)',
                    filepath: 'test/unit.js',
                    line: 21
                }));
            });
            QUnit.test('shell.surfaces.surface0', function (assert) {
                var srf = shell2.surfaces.surfaces['surface0'];
                assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(srf, 'arguments/0/left/object').is, 'arguments/0/left') === 0, 'arguments/0'), {
                    content: 'assert.ok(srf.is === 0)',
                    filepath: 'test/unit.js',
                    line: 25
                }));
                assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(srf, 'arguments/0/left/object').baseSurface, 'arguments/0/left') instanceof assert._capt(HTMLCanvasElement, 'arguments/0/right'), 'arguments/0'), {
                    content: 'assert.ok(srf.baseSurface instanceof HTMLCanvasElement)',
                    filepath: 'test/unit.js',
                    line: 26
                }));
                assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(assert._capt(srf, 'arguments/0/left/object/object').baseSurface, 'arguments/0/left/object').height, 'arguments/0/left') === 445, 'arguments/0'), {
                    content: 'assert.ok(srf.baseSurface.height === 445)',
                    filepath: 'test/unit.js',
                    line: 27
                }));
                assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(assert._capt(srf, 'arguments/0/left/object/object').baseSurface, 'arguments/0/left/object').width, 'arguments/0/left') === 182, 'arguments/0'), {
                    content: 'assert.ok(srf.baseSurface.width === 182)',
                    filepath: 'test/unit.js',
                    line: 28
                }));
                assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(assert._capt(assert._capt(srf, 'arguments/0/left/object/object/object').regions, 'arguments/0/left/object/object')['collision0'], 'arguments/0/left/object').name, 'arguments/0/left') === 'Head', 'arguments/0'), {
                    content: 'assert.ok(srf.regions["collision0"].name === "Head")',
                    filepath: 'test/unit.js',
                    line: 29
                }));
                assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(assert._capt(assert._capt(srf, 'arguments/0/left/object/object/object').animations, 'arguments/0/left/object/object')['animation0'], 'arguments/0/left/object').interval, 'arguments/0/left') === 'periodic,5', 'arguments/0'), {
                    content: 'assert.ok(srf.animations["animation0"].interval === "periodic,5")',
                    filepath: 'test/unit.js',
                    line: 30
                }));
            });
            QUnit.test('shell.surfaces.surface2', function (assert) {
                var srf = shell2.surfaces.surfaces['surface2'];
                assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(srf, 'arguments/0/left/object').is, 'arguments/0/left') === 2, 'arguments/0'), {
                    content: 'assert.ok(srf.is === 2)',
                    filepath: 'test/unit.js',
                    line: 34
                }));
                assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(srf, 'arguments/0/left/object').baseSurface, 'arguments/0/left') instanceof assert._capt(HTMLCanvasElement, 'arguments/0/right'), 'arguments/0'), {
                    content: 'assert.ok(srf.baseSurface instanceof HTMLCanvasElement)',
                    filepath: 'test/unit.js',
                    line: 35
                }));
                assert.ok(assert._expr(assert._capt(srf.baseSurface.height = 445, 'arguments/0'), {
                    content: 'assert.ok(srf.baseSurface.height = 445)',
                    filepath: 'test/unit.js',
                    line: 36
                }));
                assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(assert._capt(srf, 'arguments/0/left/object/object').baseSurface, 'arguments/0/left/object').width, 'arguments/0/left') === 182, 'arguments/0'), {
                    content: 'assert.ok(srf.baseSurface.width === 182)',
                    filepath: 'test/unit.js',
                    line: 37
                }));
                assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(assert._capt(assert._capt(srf, 'arguments/0/left/object/object/object').regions, 'arguments/0/left/object/object')['collision10'], 'arguments/0/left/object').name, 'arguments/0/left') === 'Ponytail', 'arguments/0'), {
                    content: 'assert.ok(srf.regions["collision10"].name === "Ponytail")',
                    filepath: 'test/unit.js',
                    line: 38
                }));
                assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(assert._capt(assert._capt(srf, 'arguments/0/left/object/object/object').animations, 'arguments/0/left/object/object')['animation30'], 'arguments/0/left/object').interval, 'arguments/0/left') === 'bind', 'arguments/0'), {
                    content: 'assert.ok(srf.animations["animation30"].interval === "bind")',
                    filepath: 'test/unit.js',
                    line: 39
                }));
            });
            QUnit.test('shell.surfaces.surface10', function (assert) {
                var srf = shell2.surfaces.surfaces['surface10'];
                assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(srf, 'arguments/0/left/object').is, 'arguments/0/left') === 10, 'arguments/0'), {
                    content: 'assert.ok(srf.is === 10)',
                    filepath: 'test/unit.js',
                    line: 43
                }));
                assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(srf, 'arguments/0/left/object').baseSurface, 'arguments/0/left') instanceof assert._capt(HTMLCanvasElement, 'arguments/0/right'), 'arguments/0'), {
                    content: 'assert.ok(srf.baseSurface instanceof HTMLCanvasElement)',
                    filepath: 'test/unit.js',
                    line: 44
                }));
                assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(assert._capt(srf, 'arguments/0/left/object/object').baseSurface, 'arguments/0/left/object').height, 'arguments/0/left') === 210, 'arguments/0'), {
                    content: 'assert.ok(srf.baseSurface.height === 210)',
                    filepath: 'test/unit.js',
                    line: 45
                }));
                assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(assert._capt(srf, 'arguments/0/left/object/object').baseSurface, 'arguments/0/left/object').width, 'arguments/0/left') === 230, 'arguments/0'), {
                    content: 'assert.ok(srf.baseSurface.width === 230)',
                    filepath: 'test/unit.js',
                    line: 46
                }));
                assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(assert._capt(assert._capt(srf, 'arguments/0/left/object/object/object').regions, 'arguments/0/left/object/object')['collision0'], 'arguments/0/left/object').name, 'arguments/0/left') === 'Screen', 'arguments/0'), {
                    content: 'assert.ok(srf.regions["collision0"].name === "Screen")',
                    filepath: 'test/unit.js',
                    line: 47
                }));
                assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(assert._capt(assert._capt(srf, 'arguments/0/left/object/object/object').animations, 'arguments/0/left/object/object')['animation20'], 'arguments/0/left/object').interval, 'arguments/0/left') === 'bind', 'arguments/0'), {
                    content: 'assert.ok(srf.animations["animation20"].interval === "bind")',
                    filepath: 'test/unit.js',
                    line: 48
                }));
            });
            QUnit.test('draw surface2', function (assert) {
                var cnv = document.createElement('canvas');
                var srf = shell2.attachSurface(cnv, 0, 2);
                srf.isRegionVisible = true;
                console.dir(srf);
                srf.render();
                setPictureFrame(assert.test.testName, cnv);
                var c = cuttlebone.SurfaceUtil.copy(srf.baseSurface);
                console.log(c, 'c');
                document.body.appendChild(c);
                setTimeout(function () {
                    var d = cuttlebone.SurfaceUtil.copy(srf.baseSurface);
                    console.log(d, 'd');
                    document.body.appendChild(d);
                }, 1000);
                assert.ok(true);
            });
            QUnit.test('draw surface10', function (assert) {
                var cnv = document.createElement('canvas');
                var srf = shell2.attachSurface(cnv, 1, 10);
                srf.isRegionVisible = true;
                srf.render();
                console.dir(srf);
                setPictureFrame(assert.test.testName, cnv);
                assert.ok(true);
            });
            done1();
        });
    });
    function setPictureFrame(title, cnv) {
        cnv.addEventListener('IkagakaDOMEvent', function (ev) {
            return console.log(ev.detail);
        });
        var fieldset = document.createElement('fieldset');
        var legend = document.createElement('legend');
        legend.appendChild(document.createTextNode(title));
        fieldset.appendChild(cnv);
        fieldset.appendChild(legend);
        fieldset.style.display = 'inline-block';
        document.body.appendChild(fieldset);
    }
});
QUnit.module('cuttlebone.Balloon');
prmNar.then(function (nanikaDir) {
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvdW5pdC5qcyJdLCJuYW1lcyI6WyJwcm1OYXIiLCJOYXJMb2FkZXIiLCJsb2FkRnJvbVVSTCIsInRoZW4iLCJuYW5pa2FEaXIiLCJRVW5pdCIsIm1vZHVsZSIsInNoZWxsRGlyIiwiZ2V0RGlyZWN0b3J5IiwiYXNBcnJheUJ1ZmZlciIsImNvbnNvbGUiLCJkaXIiLCJ0ZXN0IiwiYXNzZXJ0IiwiZG9uZTEiLCJhc3luYyIsInNoZWxsMSIsImN1dHRsZWJvbmUiLCJTaGVsbCIsIm9rIiwiX2V4cHIiLCJfY2FwdCIsImNvbnRlbnQiLCJmaWxlcGF0aCIsImxpbmUiLCJsb2FkIiwic2hlbGwyIiwiZGVzY3JpcHQiLCJzdXJmYWNlcyIsImNoYXJzZXQiLCJ2ZXJzaW9uIiwic3JmIiwiaXMiLCJiYXNlU3VyZmFjZSIsIkhUTUxDYW52YXNFbGVtZW50IiwiaGVpZ2h0Iiwid2lkdGgiLCJyZWdpb25zIiwibmFtZSIsImFuaW1hdGlvbnMiLCJpbnRlcnZhbCIsImNudiIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImF0dGFjaFN1cmZhY2UiLCJpc1JlZ2lvblZpc2libGUiLCJyZW5kZXIiLCJzZXRQaWN0dXJlRnJhbWUiLCJ0ZXN0TmFtZSIsImMiLCJTdXJmYWNlVXRpbCIsImNvcHkiLCJsb2ciLCJib2R5IiwiYXBwZW5kQ2hpbGQiLCJzZXRUaW1lb3V0IiwiZCIsInRpdGxlIiwiYWRkRXZlbnRMaXN0ZW5lciIsImV2IiwiZGV0YWlsIiwiZmllbGRzZXQiLCJsZWdlbmQiLCJjcmVhdGVUZXh0Tm9kZSIsInN0eWxlIiwiZGlzcGxheSJdLCJtYXBwaW5ncyI6IkFBR0EsSUFBSUEsTUFBQSxHQUFTQyxTQUFBLENBQVVDLFdBQVYsQ0FBc0IseUJBQXRCLENBQWI7QUFDQUYsTUFBQSxDQUFPRyxJQUFQLENBQVksVUFBVUMsU0FBVixFQUFxQjtBQUFBLElBQzdCQyxLQUFBLENBQU1DLE1BQU4sQ0FBYSxrQkFBYixFQUQ2QjtBQUFBLElBRTdCLElBQUlDLFFBQUEs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QU9qQ0QsUUFBQSxDQUFTRyxLQUFULENBQWVDLE9BQWYsR0FBeUIsY0FBekIsQ0FQaUM7QUFBQSxRQVFqQ3ZCLFFBQUEsQ0FBU1csSUFBVCxDQUFjQyxXQUFkLENBQTBCTyxRQUExQixFQVJpQztBQUFBLEtBdEZSO0FBQUEsQ0FBakMsRUFEQTtBQWtHQXhELEtBQUEsQ0FBTUMsTUFBTixDQUFhLG9CQUFiLEVBbEdBO0FBbUdBTixNQUFBLENBQU9HLElBQVAsQ0FBWSxVQUFVQyxTQUFWLEVBQXFCO0FBQUEsQ0FBakMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHlwaW5ncy90c2QuZC50c1wiIC8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHNkL05hckxvYWRlci9OYXJMb2FkZXIuZC50c1wiIC8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHNkL2N1dHRsZWJvbmUvY3V0dGxlYm9uZS5kLnRzXCIgLz5cbnZhciBwcm1OYXIgPSBOYXJMb2FkZXIubG9hZEZyb21VUkwoXCIuLi9uYXIvbW9iaWxlbWFzdGVyLm5hclwiKTtcbnBybU5hci50aGVuKGZ1bmN0aW9uIChuYW5pa2FEaXIpIHtcbiAgICBRVW5pdC5tb2R1bGUoXCJjdXR0bGVib25lLlNoZWxsXCIpO1xuICAgIHZhciBzaGVsbERpciA9IG5hbmlrYURpci5nZXREaXJlY3RvcnkoXCJzaGVsbC9tYXN0ZXJcIikuYXNBcnJheUJ1ZmZlcigpO1xuICAgIGNvbnNvbGUuZGlyKHNoZWxsRGlyKTtcbiAgICBRVW5pdC50ZXN0KFwic2hlbGwjbG9hZFwiLCBmdW5jdGlvbiAoYXNzZXJ0KSB7XG4gICAgICAgIHZhciBkb25lMSA9IGFzc2VydC5hc3luYygpO1xuICAgICAgICB2YXIgc2hlbGwxID0gbmV3IGN1dHRsZWJvbmUuU2hlbGwoc2hlbGxEaXIpO1xuICAgICAgICBhc3NlcnQub2soc2hlbGwxIGluc3RhbmNlb2YgY3V0dGxlYm9uZS5TaGVsbCk7XG4gICAgICAgIHNoZWxsMS5sb2FkKCkudGhlbihmdW5jdGlvbiAoc2hlbGwyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRpcihzaGVsbDIpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHNoZWxsMiA9PT0gc2hlbGwxKTtcbiAgICAgICAgICAgIFFVbml0LnRlc3QoXCJzaGVsbC5kZXNjcmlwdFwiLCBmdW5jdGlvbiAoYXNzZXJ0KSB7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHNoZWxsMi5kZXNjcmlwdFtcImtlcm8uYmluZGdyb3VwMjAubmFtZVwiXSA9PT0gXCLoo4Xlgpks6aOb6KGM6KOF5YKZXCIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBRVW5pdC50ZXN0KFwic2hlbGwuc3VyZmFjZXNcIiwgZnVuY3Rpb24gKGFzc2VydCkge1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhzaGVsbDIuc3VyZmFjZXMuY2hhcnNldCA9PT0gXCJTaGlmdF9KSVNcIik7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHNoZWxsMi5zdXJmYWNlcy5kZXNjcmlwdC52ZXJzaW9uID09PSAxKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgUVVuaXQudGVzdChcInNoZWxsLnN1cmZhY2VzLnN1cmZhY2UwXCIsIGZ1bmN0aW9uIChhc3NlcnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3JmID0gc2hlbGwyLnN1cmZhY2VzLnN1cmZhY2VzW1wic3VyZmFjZTBcIl07XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHNyZi5pcyA9PT0gMCk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHNyZi5iYXNlU3VyZmFjZSBpbnN0YW5jZW9mIEhUTUxDYW52YXNFbGVtZW50KTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2soc3JmLmJhc2VTdXJmYWNlLmhlaWdodCA9PT0gNDQ1KTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2soc3JmLmJhc2VTdXJmYWNlLndpZHRoID09PSAxODIpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhzcmYucmVnaW9uc1tcImNvbGxpc2lvbjBcIl0ubmFtZSA9PT0gXCJIZWFkXCIpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhzcmYuYW5pbWF0aW9uc1tcImFuaW1hdGlvbjBcIl0uaW50ZXJ2YWwgPT09IFwicGVyaW9kaWMsNVwiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgUVVuaXQudGVzdChcInNoZWxsLnN1cmZhY2VzLnN1cmZhY2UyXCIsIGZ1bmN0aW9uIChhc3NlcnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3JmID0gc2hlbGwyLnN1cmZhY2VzLnN1cmZhY2VzW1wic3VyZmFjZTJcIl07XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHNyZi5pcyA9PT0gMik7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHNyZi5iYXNlU3VyZmFjZSBpbnN0YW5jZW9mIEhUTUxDYW52YXNFbGVtZW50KTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2soc3JmLmJhc2VTdXJmYWNlLmhlaWdodCA9IDQ0NSk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHNyZi5iYXNlU3VyZmFjZS53aWR0aCA9PT0gMTgyKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2soc3JmLnJlZ2lvbnNbXCJjb2xsaXNpb24xMFwiXS5uYW1lID09PSBcIlBvbnl0YWlsXCIpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhzcmYuYW5pbWF0aW9uc1tcImFuaW1hdGlvbjMwXCJdLmludGVydmFsID09PSBcImJpbmRcIik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFFVbml0LnRlc3QoXCJzaGVsbC5zdXJmYWNlcy5zdXJmYWNlMTBcIiwgZnVuY3Rpb24gKGFzc2VydCkge1xuICAgICAgICAgICAgICAgIHZhciBzcmYgPSBzaGVsbDIuc3VyZmFjZXMuc3VyZmFjZXNbXCJzdXJmYWNlMTBcIl07XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHNyZi5pcyA9PT0gMTApO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhzcmYuYmFzZVN1cmZhY2UgaW5zdGFuY2VvZiBIVE1MQ2FudmFzRWxlbWVudCk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHNyZi5iYXNlU3VyZmFjZS5oZWlnaHQgPT09IDIxMCk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHNyZi5iYXNlU3VyZmFjZS53aWR0aCA9PT0gMjMwKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2soc3JmLnJlZ2lvbnNbXCJjb2xsaXNpb24wXCJdLm5hbWUgPT09IFwiU2NyZWVuXCIpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhzcmYuYW5pbWF0aW9uc1tcImFuaW1hdGlvbjIwXCJdLmludGVydmFsID09PSBcImJpbmRcIik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8qUVVuaXQudGVzdChcImRyYXcgc3VyZmFjZTBcIiwgKGFzc2VydCk9PiB7XG4gICAgICAgICAgICAgIHZhciBjbnYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xuICAgICAgICAgICAgICB2YXIgc3JmID0gc2hlbGwyLmF0dGFjaFN1cmZhY2UoY252LCAwLCAwKTtcbiAgICAgICAgICAgICAgc3JmLmlzUmVnaW9uVmlzaWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZGlyKHNyZik7XG4gICAgICAgICAgICAgIHNyZi5iaW5kKDMwKTtcbiAgICAgICAgICAgICAgc3JmLmJpbmQoMzEpO1xuICAgICAgICAgICAgICBzcmYuYmluZCgzMik7XG4gICAgICAgICAgICAgIHNyZi5iaW5kKDUwKTtcbiAgICAgICAgICAgICAgc2V0UGljdHVyZUZyYW1lKGFzc2VydC50ZXN0LnRlc3ROYW1lLCBjbnYpO1xuICAgICAgICAgICAgICBhc3NlcnQub2sodHJ1ZSk7XG4gICAgICAgICAgICB9KTsqL1xuICAgICAgICAgICAgUVVuaXQudGVzdChcImRyYXcgc3VyZmFjZTJcIiwgZnVuY3Rpb24gKGFzc2VydCkge1xuICAgICAgICAgICAgICAgIHZhciBjbnYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xuICAgICAgICAgICAgICAgIHZhciBzcmYgPSBzaGVsbDIuYXR0YWNoU3VyZmFjZShjbnYsIDAsIDIpO1xuICAgICAgICAgICAgICAgIHNyZi5pc1JlZ2lvblZpc2libGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGlyKHNyZik7XG4gICAgICAgICAgICAgICAgc3JmLnJlbmRlcigpO1xuICAgICAgICAgICAgICAgIHNldFBpY3R1cmVGcmFtZShhc3NlcnQudGVzdC50ZXN0TmFtZSwgY252KTtcbiAgICAgICAgICAgICAgICB2YXIgYyA9IGN1dHRsZWJvbmUuU3VyZmFjZVV0aWwuY29weShzcmYuYmFzZVN1cmZhY2UpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGMsIFwiY1wiKTtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGMpO1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZCA9IGN1dHRsZWJvbmUuU3VyZmFjZVV0aWwuY29weShzcmYuYmFzZVN1cmZhY2UpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhkLCBcImRcIik7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZCk7XG4gICAgICAgICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHRydWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBRVW5pdC50ZXN0KFwiZHJhdyBzdXJmYWNlMTBcIiwgZnVuY3Rpb24gKGFzc2VydCkge1xuICAgICAgICAgICAgICAgIHZhciBjbnYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xuICAgICAgICAgICAgICAgIHZhciBzcmYgPSBzaGVsbDIuYXR0YWNoU3VyZmFjZShjbnYsIDEsIDEwKTtcbiAgICAgICAgICAgICAgICBzcmYuaXNSZWdpb25WaXNpYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBzcmYucmVuZGVyKCk7IC8vIHJlbmRlcuOBleOCjOOBquOBhOOBqOihqOekuuOBl+OBquOBhOOBn+OCgShcXHNbMTBd44Gv44Ki44OL44Oh44O844K344On44Oz44GM44Gq44GEKVxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGlyKHNyZik7XG4gICAgICAgICAgICAgICAgc2V0UGljdHVyZUZyYW1lKGFzc2VydC50ZXN0LnRlc3ROYW1lLCBjbnYpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayh0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZG9uZTEoKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgZnVuY3Rpb24gc2V0UGljdHVyZUZyYW1lKHRpdGxlLCBjbnYpIHtcbiAgICAgICAgY252LmFkZEV2ZW50TGlzdGVuZXIoXCJJa2FnYWthRE9NRXZlbnRcIiwgZnVuY3Rpb24gKGV2KSB7IHJldHVybiBjb25zb2xlLmxvZyhldi5kZXRhaWwpOyB9KTtcbiAgICAgICAgdmFyIGZpZWxkc2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImZpZWxkc2V0XCIpO1xuICAgICAgICB2YXIgbGVnZW5kID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxlZ2VuZFwiKTtcbiAgICAgICAgbGVnZW5kLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRpdGxlKSk7XG4gICAgICAgIGZpZWxkc2V0LmFwcGVuZENoaWxkKGNudik7XG4gICAgICAgIGZpZWxkc2V0LmFwcGVuZENoaWxkKGxlZ2VuZCk7XG4gICAgICAgIGZpZWxkc2V0LnN0eWxlLmRpc3BsYXkgPSBcImlubGluZS1ibG9ja1wiO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGZpZWxkc2V0KTtcbiAgICB9XG59KTtcblFVbml0Lm1vZHVsZShcImN1dHRsZWJvbmUuQmFsbG9vblwiKTtcbnBybU5hci50aGVuKGZ1bmN0aW9uIChuYW5pa2FEaXIpIHtcbiAgICAvL2NvbnNvbGUuZGlyKG5hbmlrYURpcik7XG59KTtcbiJdfQ==

