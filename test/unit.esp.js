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
            QUnit.test('draw surface0', function (assert) {
                var cnv = document.createElement('canvas');
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
            QUnit.test('draw surface10', function (assert) {
                var cnv = document.createElement('canvas');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvdW5pdC5qcyJdLCJuYW1lcyI6WyJwcm1OYXIiLCJOYXJMb2FkZXIiLCJsb2FkRnJvbVVSTCIsInRoZW4iLCJuYW5pa2FEaXIiLCJRVW5pdCIsIm1vZHVsZSIsInNoZWxsRGlyIiwiZ2V0RGlyZWN0b3J5IiwiYXNBcnJheUJ1ZmZlciIsImNvbnNvbGUiLCJkaXIiLCJ0ZXN0IiwiYXNzZXJ0IiwiZG9uZTEiLCJhc3luYyIsInNoZWxsMSIsImN1dHRsZWJvbmUiLCJTaGVsbCIsIm9rIiwiX2V4cHIiLCJfY2FwdCIsImNvbnRlbnQiLCJmaWxlcGF0aCIsImxpbmUiLCJsb2FkIiwic2hlbGwyIiwiZGVzY3JpcHQiLCJzdXJmYWNlcyIsImNoYXJzZXQiLCJ2ZXJzaW9uIiwic3JmIiwiaXMiLCJiYXNlU3VyZmFjZSIsIkhUTUxDYW52YXNFbGVtZW50IiwiaGVpZ2h0Iiwid2lkdGgiLCJyZWdpb25zIiwibmFtZSIsImFuaW1hdGlvbnMiLCJpbnRlcnZhbCIsImNudiIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImF0dGFjaFN1cmZhY2UiLCJpc1JlZ2lvblZpc2libGUiLCJiaW5kIiwic2V0UGljdHVyZUZyYW1lIiwidGVzdE5hbWUiLCJ0aXRsZSIsImZpZWxkc2V0IiwibGVnZW5kIiwiYXBwZW5kQ2hpbGQiLCJjcmVhdGVUZXh0Tm9kZSIsInN0eWxlIiwiZGlzcGxheSIsImJvZHkiXSwibWFwcGluZ3MiOiJBQUdBLElBQUlBLE1BQUEsR0FBU0MsU0FBQSxDQUFVQyxXQUFWLENBQXNCLHlCQUF0QixDQUFiO0FBQ0FGLE1BQUEsQ0FBT0csSUFBUCxDQUFZLFVBQVVDLFNBQVYsRUFBcUI7QUFBQSxJQUM3QkMsS0FBQSxDQUFNQyxNQUFOLENBQWEsa0JBQWIsRUFENkI7QUFBQSxJQUU3QixJQUFJQyxRQUFBLEdBQVdILFNBQUEsQ0FBVUksWUFBVixDQUF1QixjQUF2QixFQUF1Q0MsYUFBdkMsRUFBZixDQUY2QjtBQUFBLElBRzdCQyxPQUFBLENBQVFDLEdBQVIsQ0FBWUosUUFBWixFQUg2QjtBQUFBLElBSTdCRixLQUFBLENBQU1PLElBQU4sQ0FBVyxZQUFYLEVBQXlCLFVBQVVDLE1BQVYsRUFBa0I7QUFBQSxRQUN2QyxJQUFJQyxLQUFBLEdBQVFELE1BQUEsQ0FBT0UsS0FBUCxFQUFaLENBRHVDO0FBQUEsUUFFdkMsSUFBSUMsTUFBQSxHQUFTLElBQUlDLFVBQUEsQ0FBV0MsS0FBZixDQUFxQlgsUUFBckIsQ0FBYixDQUZ1QztBQUFBLFFBR3ZDTSxNQUFBLENBQU9NLEVBQVAsQ0FBVU4sTUFBQSxDQUFBTyxLQUFBLENBQUFQLE1BQUEsQ0FBQVEsS0FBQSxDQUFBUixNQUFBLENBQUFRLEtBQUEsQ0FBQUwsTUFBQSxpQ0FBa0JILE1BQUEsQ0FBQVEsS0FBQSxDQUFBUixNQUFBLENBQUFRLEtBQUEsQ0FBQUosVUFBQSw4QkFBV0MsS0FBWCxzQkFBbEI7QUFBQSxZQUFBSSxPQUFBO0FBQUEsWUFBQUMsUUFBQTtBQUFBLFlBQUFDLElBQUE7QUFBQSxVQUFWLEVBSHVDO0FBQUEsUUFJdkNSLE1BQUEsQ0FBT1MsSUFBUCxHQUFjdEIsSUFBZCxDQUFtQixVQUFVdUIsTUFBVixFQUFrQjtBQUFBLFlBQ2pDaEIsT0FBQSxDQUFRQyxHQUFSLENBQVllLE1BQVosRUFEaUM7QUFBQSxZQUVqQ2IsTUFBQSxDQUFPTSxFQUFQLENBQVVOLE1BQUEsQ0FBQU8sS0FBQSxDQUFBUCxNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFLLE1BQUEsMEJBQVdiLE1BQUEsQ0FBQVEsS0FBQSxDQUFBTCxNQUFBLHNCQUFYO0FBQUEsZ0JBQUFNLE9BQUE7QUFBQSxnQkFBQUMsUUFBQTtBQUFBLGdCQUFBQyxJQUFBO0FBQUEsY0FBVixFQUZpQztBQUFBLFlBR2pDbkIsS0FBQSxDQUFNTyxJQUFOLENBQVcsZ0JBQVgsRUFBNkIsVUFBVUMsTUFBVixFQUFrQjtBQUFBLGdCQUMzQ0EsTUFBQSxDQUFPTSxFQUFQLENBQVVOLE1BQUEsQ0FBQU8sS0FBQSxDQUFBUCxNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFSLE1BQUEsQ0FBQVEsS0FBQSxDQUFBUixNQUFBLENBQUFRLEtBQUEsQ0FBQUssTUFBQSxvQ0FBT0MsUUFBUCw2QkFBZ0IsdUJBQWhCLDJCQUE2Qyx1Q0FBN0M7QUFBQSxvQkFBQUwsT0FBQTtBQUFBLG9CQUFBQyxRQUFBO0FBQUEsb0JBQUFDLElBQUE7QUFBQSxrQkFBVixFQUQyQztBQUFBLGFBQS9DLEVBSGlDO0FBQUEsWUFNakNuQixLQUFBLENBQU1PLElBQU4sQ0FBVyxnQkFBWCxFQUE2QixVQUFVQyxNQUFWLEVBQWtCO0FBQUEsZ0JBQzNDQSxNQUFBLENBQU9NLEVBQVAsQ0FBVU4sTUFBQSxDQUFBTyxLQUFBLENBQUFQLE1BQUEsQ0FBQVEsS0FBQSxDQUFBUixNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFSLE1BQUEsQ0FBQVEsS0FBQSxDQUFBSyxNQUFBLG9DQUFPRSxRQUFQLDZCQUFnQkMsT0FBaEIsMEJBQTRCLFdBQTVCO0FBQUEsb0JBQUFQLE9BQUE7QUFBQSxvQkFBQUMsUUFBQTtBQUFBLG9CQUFBQyxJQUFBO0FBQUEsa0JBQVYsRUFEMkM7QUFBQSxnQkFFM0NYLE1BQUEsQ0FBT00sRUFBUCxDQUFVTixNQUFBLENBQUFPLEtBQUEsQ0FBQVAsTUFBQSxDQUFBUSxLQUFBLENBQUFSLE1BQUEsQ0FBQVEsS0FBQSxDQUFBUixNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFSLE1BQUEsQ0FBQVEsS0FBQSxDQUFBSyxNQUFBLDJDQUFPRSxRQUFQLG9DQUFnQkQsUUFBaEIsNkJBQXlCRyxPQUF6QiwwQkFBcUMsQ0FBckM7QUFBQSxvQkFBQVIsT0FBQTtBQUFBLG9CQUFBQyxRQUFBO0FBQUEsb0JBQUFDLElBQUE7QUFBQSxrQkFBVixFQUYyQztBQUFBLGFBQS9DLEVBTmlDO0FBQUEsWUFVakNuQixLQUFBLENBQU1PLElBQU4sQ0FBVyx5QkFBWCxFQUFzQyxVQUFVQyxNQUFWLEVBQWtCO0FBQUEsZ0JBQ3BELElBQUlrQixHQUFBLEdBQU1MLE1BQUEsQ0FBT0UsUUFBUCxDQUFnQkEsUUFBaEIsQ0FBeUIsVUFBekIsQ0FBVixDQURvRDtBQUFBLGdCQUVwRGYsTUFBQSxDQUFPTSxFQUFQLENBQVVOLE1BQUEsQ0FBQU8sS0FBQSxDQUFBUCxNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFSLE1BQUEsQ0FBQVEsS0FBQSxDQUFBVSxHQUFBLDZCQUFJQyxFQUFKLDBCQUFXLENBQVg7QUFBQSxvQkFBQVYsT0FBQTtBQUFBLG9CQUFBQyxRQUFBO0FBQUEsb0JBQUFDLElBQUE7QUFBQSxrQkFBVixFQUZvRDtBQUFBLGdCQUdwRFgsTUFBQSxDQUFPTSxFQUFQLENBQVVOLE1BQUEsQ0FBQU8sS0FBQSxDQUFBUCxNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFSLE1BQUEsQ0FBQVEsS0FBQSxDQUFBVSxHQUFBLDZCQUFJRSxXQUFKLGlDQUEyQnBCLE1BQUEsQ0FBQVEsS0FBQSxDQUFBYSxpQkFBQSxzQkFBM0I7QUFBQSxvQkFBQVosT0FBQTtBQUFBLG9CQUFBQyxRQUFBO0FBQUEsb0JBQUFDLElBQUE7QUFBQSxrQkFBVixFQUhvRDtBQUFBLGdCQUlwRFgsTUFBQSxDQUFPTSxFQUFQLENBQVVOLE1BQUEsQ0FBQU8sS0FBQSxDQUFBUCxNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFSLE1BQUEsQ0FBQVEsS0FBQSxDQUFBUixNQUFBLENBQUFRLEtBQUEsQ0FBQVUsR0FBQSxvQ0FBSUUsV0FBSiw2QkFBZ0JFLE1BQWhCLDBCQUEyQixHQUEzQjtBQUFBLG9CQUFBYixPQUFBO0FBQUEsb0JBQUFDLFFBQUE7QUFBQSxvQkFBQUMsSUFBQTtBQUFBLGtCQUFWLEVBSm9EO0FBQUEsZ0JBS3BEWCxNQUFBLENBQU9NLEVBQVAsQ0FBVU4sTUFBQSxDQUFBTyxLQUFBLENBQUFQLE1BQUEsQ0FBQVEsS0FBQSxDQUFBUixNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFSLE1BQUEsQ0FBQVEsS0FBQSxDQUFBVSxHQUFBLG9DQUFJRSxXQUFKLDZCQUFnQkcsS0FBaEIsMEJBQTBCLEdBQTFCO0FBQUEsb0JBQUFkLE9BQUE7QUFBQSxvQkFBQUMsUUFBQTtBQUFBLG9CQUFBQyxJQUFBO0FBQUEsa0JBQVYsRUFMb0Q7QUFBQSxnQkFNcERYLE1BQUEsQ0FBT00sRUFBUCxDQUFVTixNQUFBLENBQUFPLEtBQUEsQ0FBQVAsTUFBQSxDQUFBUSxLQUFBLENBQUFSLE1BQUEsQ0FBQVEsS0FBQSxDQUFBUixNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFSLE1BQUEsQ0FBQVEsS0FBQSxDQUFBVSxHQUFBLDJDQUFJTSxPQUFKLG9DQUFZLFlBQVosOEJBQTBCQyxJQUExQiwwQkFBbUMsTUFBbkM7QUFBQSxvQkFBQWhCLE9BQUE7QUFBQSxvQkFBQUMsUUFBQTtBQUFBLG9CQUFBQyxJQUFBO0FBQUEsa0JBQVYsRUFOb0Q7QUFBQSxnQkFPcERYLE1BQUEsQ0FBT00sRUFBUCxDQUFVTixNQUFBLENBQUFPLEtBQUEsQ0FBQVAsTUFBQSxDQUFBUSxLQUFBLENBQUFSLE1BQUEsQ0FBQVEsS0FBQSxDQUFBUixNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFSLE1BQUEsQ0FBQVEsS0FBQSxDQUFBVSxHQUFBLDJDQUFJUSxVQUFKLG9DQUFlLFlBQWYsOEJBQTZCQyxRQUE3QiwwQkFBMEMsWUFBMUM7QUFBQSxvQkFBQWxCLE9BQUE7QUFBQSxvQkFBQUMsUUFBQTtBQUFBLG9CQUFBQyxJQUFBO0FBQUEsa0JBQVYsRUFQb0Q7QUFBQSxhQUF4RCxFQVZpQztBQUFBLFlBbUJqQ25CLEtBQUEsQ0FBTU8sSUFBTixDQUFXLHlCQUFYLEVBQXNDLFVBQVVDLE1BQVYsRUFBa0I7QUFBQSxnQkFDcEQsSUFBSWtCLEdBQUEsR0FBTUwsTUFBQSxDQUFPRSxRQUFQLENBQWdCQSxRQUFoQixDQUF5QixVQUF6QixDQUFWLENBRG9EO0FBQUEsZ0JBRXBEZixNQUFBLENBQU9NLEVBQVAsQ0FBVU4sTUFBQSxDQUFBTyxLQUFBLENBQUFQLE1BQUEsQ0FBQVEsS0FBQSxDQUFBUixNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFVLEdBQUEsNkJBQUlDLEVBQUosMEJBQVcsQ0FBWDtBQUFBLG9CQUFBVixPQUFBO0FBQUEsb0JBQUFDLFFBQUE7QUFBQSxvQkFBQUMsSUFBQTtBQUFBLGtCQUFWLEVBRm9EO0FBQUEsZ0JBR3BEWCxNQUFBLENBQU9NLEVBQVAsQ0FBVU4sTUFBQSxDQUFBTyxLQUFBLENBQUFQLE1BQUEsQ0FBQVEsS0FBQSxDQUFBUixNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFVLEdBQUEsNkJBQUlFLFdBQUosaUNBQTJCcEIsTUFBQSxDQUFBUSxLQUFBLENBQUFhLGlCQUFBLHNCQUEzQjtBQUFBLG9CQUFBWixPQUFBO0FBQUEsb0JBQUFDLFFBQUE7QUFBQSxvQkFBQUMsSUFBQTtBQUFBLGtCQUFWLEVBSG9EO0FBQUEsZ0JBSXBEWCxNQUFBLENBQU9NLEVBQVAsQ0FBVU4sTUFBQSxDQUFBTyxLQUFBLENBQUFQLE1BQUEsQ0FBQVEsS0FBQSxDQUFBVSxHQUFBLENBQUlFLFdBQUosQ0FBZ0JFLE1BQWhCLEdBQXlCLEdBQXpCO0FBQUEsb0JBQUFiLE9BQUE7QUFBQSxvQkFBQUMsUUFBQTtBQUFBLG9CQUFBQyxJQUFBO0FBQUEsa0JBQVYsRUFKb0Q7QUFBQSxnQkFLcERYLE1BQUEsQ0FBT00sRUFBUCxDQUFVTixNQUFBLENBQUFPLEtBQUEsQ0FBQVAsTUFBQSxDQUFBUSxLQUFBLENBQUFSLE1BQUEsQ0FBQVEsS0FBQSxDQUFBUixNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFVLEdBQUEsb0NBQUlFLFdBQUosNkJBQWdCRyxLQUFoQiwwQkFBMEIsR0FBMUI7QUFBQSxvQkFBQWQsT0FBQTtBQUFBLG9CQUFBQyxRQUFBO0FBQUEsb0JBQUFDLElBQUE7QUFBQSxrQkFBVixFQUxvRDtBQUFBLGdCQU1wRFgsTUFBQSxDQUFPTSxFQUFQLENBQVVOLE1BQUEsQ0FBQU8sS0FBQSxDQUFBUCxNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFSLE1BQUEsQ0FBQVEsS0FBQSxDQUFBUixNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFVLEdBQUEsMkNBQUlNLE9BQUosb0NBQVksYUFBWiw4QkFBMkJDLElBQTNCLDBCQUFvQyxVQUFwQztBQUFBLG9CQUFBaEIsT0FBQTtBQUFBLG9CQUFBQyxRQUFBO0FBQUEsb0JBQUFDLElBQUE7QUFBQSxrQkFBVixFQU5vRDtBQUFBLGdCQU9wRFgsTUFBQSxDQUFPTSxFQUFQLENBQVVOLE1BQUEsQ0FBQU8sS0FBQSxDQUFBUCxNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFSLE1BQUEsQ0FBQVEsS0FBQSxDQUFBUixNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFVLEdBQUEsMkNBQUlRLFVBQUosb0NBQWUsYUFBZiw4QkFBOEJDLFFBQTlCLDBCQUEyQyxNQUEzQztBQUFBLG9CQUFBbEIsT0FBQTtBQUFBLG9CQUFBQyxRQUFBO0FBQUEsb0JBQUFDLElBQUE7QUFBQSxrQkFBVixFQVBvRDtBQUFBLGFBQXhELEVBbkJpQztBQUFBLFlBNEJqQ25CLEtBQUEsQ0FBTU8sSUFBTixDQUFXLDBCQUFYLEVBQXVDLFVBQVVDLE1BQVYsRUFBa0I7QUFBQSxnQkFDckQsSUFBSWtCLEdBQUEsR0FBTUwsTUFBQSxDQUFPRSxRQUFQLENBQWdCQSxRQUFoQixDQUF5QixXQUF6QixDQUFWLENBRHFEO0FBQUEsZ0JBRXJEZixNQUFBLENBQU9NLEVBQVAsQ0FBVU4sTUFBQSxDQUFBTyxLQUFBLENBQUFQLE1BQUEsQ0FBQVEsS0FBQSxDQUFBUixNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFVLEdBQUEsNkJBQUlDLEVBQUosMEJBQVcsRUFBWDtBQUFBLG9CQUFBVixPQUFBO0FBQUEsb0JBQUFDLFFBQUE7QUFBQSxvQkFBQUMsSUFBQTtBQUFBLGtCQUFWLEVBRnFEO0FBQUEsZ0JBR3JEWCxNQUFBLENBQU9NLEVBQVAsQ0FBVU4sTUFBQSxDQUFBTyxLQUFBLENBQUFQLE1BQUEsQ0FBQVEsS0FBQSxDQUFBUixNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFVLEdBQUEsNkJBQUlFLFdBQUosaUNBQTJCcEIsTUFBQSxDQUFBUSxLQUFBLENBQUFhLGlCQUFBLHNCQUEzQjtBQUFBLG9CQUFBWixPQUFBO0FBQUEsb0JBQUFDLFFBQUE7QUFBQSxvQkFBQUMsSUFBQTtBQUFBLGtCQUFWLEVBSHFEO0FBQUEsZ0JBSXJEWCxNQUFBLENBQU9NLEVBQVAsQ0FBVU4sTUFBQSxDQUFBTyxLQUFBLENBQUFQLE1BQUEsQ0FBQVEsS0FBQSxDQUFBUixNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFSLE1BQUEsQ0FBQVEsS0FBQSxDQUFBVSxHQUFBLG9DQUFJRSxXQUFKLDZCQUFnQkUsTUFBaEIsMEJBQTJCLEdBQTNCO0FBQUEsb0JBQUFiLE9BQUE7QUFBQSxvQkFBQUMsUUFBQTtBQUFBLG9CQUFBQyxJQUFBO0FBQUEsa0JBQVYsRUFKcUQ7QUFBQSxnQkFLckRYLE1BQUEsQ0FBT00sRUFBUCxDQUFVTixNQUFBLENBQUFPLEtBQUEsQ0FBQVAsTUFBQSxDQUFBUSxLQUFBLENBQUFSLE1BQUEsQ0FBQVEsS0FBQSxDQUFBUixNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFVLEdBQUEsb0NBQUlFLFdBQUosNkJBQWdCRyxLQUFoQiwwQkFBMEIsR0FBMUI7QUFBQSxvQkFBQWQsT0FBQTtBQUFBLG9CQUFBQyxRQUFBO0FBQUEsb0JBQUFDLElBQUE7QUFBQSxrQkFBVixFQUxxRDtBQUFBLGdCQU1yRFgsTUFBQSxDQUFPTSxFQUFQLENBQVVOLE1BQUEsQ0FBQU8sS0FBQSxDQUFBUCxNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFSLE1BQUEsQ0FBQVEsS0FBQSxDQUFBUixNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFVLEdBQUEsMkNBQUlNLE9BQUosb0NBQVksWUFBWiw4QkFBMEJDLElBQTFCLDBCQUFtQyxRQUFuQztBQUFBLG9CQUFBaEIsT0FBQTtBQUFBLG9CQUFBQyxRQUFBO0FBQUEsb0JBQUFDLElBQUE7QUFBQSxrQkFBVixFQU5xRDtBQUFBLGdCQU9yRFgsTUFBQSxDQUFPTSxFQUFQLENBQVVOLE1BQUEsQ0FBQU8sS0FBQSxDQUFBUCxNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFSLE1BQUEsQ0FBQVEsS0FBQSxDQUFBUixNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFVLEdBQUEsMkNBQUlRLFVBQUosb0NBQWUsYUFBZiw4QkFBOEJDLFFBQTlCLDBCQUEyQyxNQUEzQztBQUFBLG9CQUFBbEIsT0FBQTtBQUFBLG9CQUFBQyxRQUFBO0FBQUEsb0JBQUFDLElBQUE7QUFBQSxrQkFBVixFQVBxRDtBQUFBLGFBQXpELEVBNUJpQztBQUFBLFlBcUNqQ25CLEtBQUEsQ0FBTU8sSUFBTixDQUFXLGVBQVgsRUFBNEIsVUFBVUMsTUFBVixFQUFrQjtBQUFBLGdCQUMxQyxJQUFJNEIsR0FBQSxHQUFNQyxRQUFBLENBQVNDLGFBQVQsQ0FBdUIsUUFBdkIsQ0FBVixDQUQwQztBQUFBLGdCQUUxQyxJQUFJWixHQUFBLEdBQU1MLE1BQUEsQ0FBT2tCLGFBQVAsQ0FBcUJILEdBQXJCLEVBQTBCLENBQTFCLEVBQTZCLENBQTdCLENBQVYsQ0FGMEM7QUFBQSxnQkFHMUNWLEdBQUEsQ0FBSWMsZUFBSixHQUFzQixJQUF0QixDQUgwQztBQUFBLGdCQUkxQ25DLE9BQUEsQ0FBUUMsR0FBUixDQUFZb0IsR0FBWixFQUowQztBQUFBLGdCQUsxQ0EsR0FBQSxDQUFJZSxJQUFKLENBQVMsRUFBVCxFQUwwQztBQUFBLGdCQU0xQ2YsR0FBQSxDQUFJZSxJQUFKLENBQVMsRUFBVCxFQU4wQztBQUFBLGdCQU8xQ2YsR0FBQSxDQUFJZSxJQUFKLENBQVMsRUFBVCxFQVAwQztBQUFBLGdCQVExQ2YsR0FBQSxDQUFJZSxJQUFKLENBQVMsRUFBVCxFQVIwQztBQUFBLGdCQVMxQ0MsZUFBQSxDQUFnQmxDLE1BQUEsQ0FBT0QsSUFBUCxDQUFZb0MsUUFBNUIsRUFBc0NQLEdBQXRDLEVBVDBDO0FBQUEsZ0JBVTFDNUIsTUFBQSxDQUFPTSxFQUFQLENBQVUsSUFBVixFQVYwQztBQUFBLGFBQTlDLEVBckNpQztBQUFBLFlBaURqQ2QsS0FBQSxDQUFNTyxJQUFOLENBQVcsZ0JBQVgsRUFBNkIsVUFBVUMsTUFBVixFQUFrQjtBQUFBLGdCQUMzQyxJQUFJNEIsR0FBQSxHQUFNQyxRQUFBLENBQVNDLGFBQVQsQ0FBdUIsUUFBdkIsQ0FBVixDQUQyQztBQUFBLGdCQUUzQyxJQUFJWixHQUFBLEdBQU1MLE1BQUEsQ0FBT2tCLGFBQVAsQ0FBcUJILEdBQXJCLEVBQTBCLENBQTFCLEVBQTZCLEVBQTdCLENBQVYsQ0FGMkM7QUFBQSxnQkFHM0NWLEdBQUEsQ0FBSWMsZUFBSixHQUFzQixJQUF0QixDQUgyQztBQUFBLGdCQUkzQ25DLE9BQUEsQ0FBUUMsR0FBUixDQUFZb0IsR0FBWixFQUoyQztBQUFBLGdCQUszQ2dCLGVBQUEsQ0FBZ0JsQyxNQUFBLENBQU9ELElBQVAsQ0FBWW9DLFFBQTVCLEVBQXNDUCxHQUF0QyxFQUwyQztBQUFBLGdCQU0zQzVCLE1BQUEsQ0FBT00sRUFBUCxDQUFVLElBQVYsRUFOMkM7QUFBQSxhQUEvQyxFQWpEaUM7QUFBQSxZQXlEakNMLEtBQUEsR0F6RGlDO0FBQUEsU0FBckMsRUFKdUM7QUFBQSxLQUEzQyxFQUo2QjtBQUFBLElBb0U3QixTQUFTaUMsZUFBVCxDQUF5QkUsS0FBekIsRUFBZ0NSLEdBQWhDLEVBQXFDO0FBQUEsUUFDakMsSUFBSVMsUUFBQSxHQUFXUixRQUFBLENBQVNDLGFBQVQsQ0FBdUIsVUFBdkIsQ0FBZixDQURpQztBQUFBLFFBRWpDLElBQUlRLE1BQUEsR0FBU1QsUUFBQSxDQUFTQyxhQUFULENBQXVCLFFBQXZCLENBQWIsQ0FGaUM7QUFBQSxRQUdqQ1EsTUFBQSxDQUFPQyxXQUFQLENBQW1CVixRQUFBLENBQVNXLGNBQVQsQ0FBd0JKLEtBQXhCLENBQW5CLEVBSGlDO0FBQUEsUUFJakNDLFFBQUEsQ0FBU0UsV0FBVCxDQUFxQlgsR0FBckIsRUFKaUM7QUFBQSxRQUtqQ1MsUUFBQSxDQUFTRSxXQUFULENBQXFCRCxNQUFyQixFQUxpQztBQUFBLFFBTWpDRCxRQUFBLENBQVNJLEtBQVQsQ0FBZUMsT0FBZixHQUF5QixjQUF6QixDQU5pQztBQUFBLFFBT2pDYixRQUFBLENBQVNjLElBQVQsQ0FBY0osV0FBZCxDQUEwQkYsUUFBMUIsRUFQaUM7QUFBQSxLQXBFUjtBQUFBLENBQWpDLEVBREE7QUErRUE3QyxLQUFBLENBQU1DLE1BQU4sQ0FBYSxvQkFBYixFQS9FQTtBQWdGQU4sTUFBQSxDQUFPRyxJQUFQLENBQVksVUFBVUMsU0FBVixFQUFxQjtBQUFBLENBQWpDIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGluZ3MvdHNkLmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3RzZC9OYXJMb2FkZXIvTmFyTG9hZGVyLmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3RzZC9jdXR0bGVib25lL2N1dHRsZWJvbmUuZC50c1wiIC8+XG52YXIgcHJtTmFyID0gTmFyTG9hZGVyLmxvYWRGcm9tVVJMKFwiLi4vbmFyL21vYmlsZW1hc3Rlci5uYXJcIik7XG5wcm1OYXIudGhlbihmdW5jdGlvbiAobmFuaWthRGlyKSB7XG4gICAgUVVuaXQubW9kdWxlKFwiY3V0dGxlYm9uZS5TaGVsbFwiKTtcbiAgICB2YXIgc2hlbGxEaXIgPSBuYW5pa2FEaXIuZ2V0RGlyZWN0b3J5KFwic2hlbGwvbWFzdGVyXCIpLmFzQXJyYXlCdWZmZXIoKTtcbiAgICBjb25zb2xlLmRpcihzaGVsbERpcik7XG4gICAgUVVuaXQudGVzdChcInNoZWxsI2xvYWRcIiwgZnVuY3Rpb24gKGFzc2VydCkge1xuICAgICAgICB2YXIgZG9uZTEgPSBhc3NlcnQuYXN5bmMoKTtcbiAgICAgICAgdmFyIHNoZWxsMSA9IG5ldyBjdXR0bGVib25lLlNoZWxsKHNoZWxsRGlyKTtcbiAgICAgICAgYXNzZXJ0Lm9rKHNoZWxsMSBpbnN0YW5jZW9mIGN1dHRsZWJvbmUuU2hlbGwpO1xuICAgICAgICBzaGVsbDEubG9hZCgpLnRoZW4oZnVuY3Rpb24gKHNoZWxsMikge1xuICAgICAgICAgICAgY29uc29sZS5kaXIoc2hlbGwyKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhzaGVsbDIgPT09IHNoZWxsMSk7XG4gICAgICAgICAgICBRVW5pdC50ZXN0KFwic2hlbGwuZGVzY3JpcHRcIiwgZnVuY3Rpb24gKGFzc2VydCkge1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhzaGVsbDIuZGVzY3JpcHRbXCJrZXJvLmJpbmRncm91cDIwLm5hbWVcIl0gPT09IFwi6KOF5YKZLOmjm+ihjOijheWCmVwiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgUVVuaXQudGVzdChcInNoZWxsLnN1cmZhY2VzXCIsIGZ1bmN0aW9uIChhc3NlcnQpIHtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2soc2hlbGwyLnN1cmZhY2VzLmNoYXJzZXQgPT09IFwiU2hpZnRfSklTXCIpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhzaGVsbDIuc3VyZmFjZXMuZGVzY3JpcHQudmVyc2lvbiA9PT0gMSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFFVbml0LnRlc3QoXCJzaGVsbC5zdXJmYWNlcy5zdXJmYWNlMFwiLCBmdW5jdGlvbiAoYXNzZXJ0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHNyZiA9IHNoZWxsMi5zdXJmYWNlcy5zdXJmYWNlc1tcInN1cmZhY2UwXCJdO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhzcmYuaXMgPT09IDApO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhzcmYuYmFzZVN1cmZhY2UgaW5zdGFuY2VvZiBIVE1MQ2FudmFzRWxlbWVudCk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHNyZi5iYXNlU3VyZmFjZS5oZWlnaHQgPT09IDQ0NSk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHNyZi5iYXNlU3VyZmFjZS53aWR0aCA9PT0gMTgyKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2soc3JmLnJlZ2lvbnNbXCJjb2xsaXNpb24wXCJdLm5hbWUgPT09IFwiSGVhZFwiKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2soc3JmLmFuaW1hdGlvbnNbXCJhbmltYXRpb24wXCJdLmludGVydmFsID09PSBcInBlcmlvZGljLDVcIik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFFVbml0LnRlc3QoXCJzaGVsbC5zdXJmYWNlcy5zdXJmYWNlMlwiLCBmdW5jdGlvbiAoYXNzZXJ0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHNyZiA9IHNoZWxsMi5zdXJmYWNlcy5zdXJmYWNlc1tcInN1cmZhY2UyXCJdO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhzcmYuaXMgPT09IDIpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhzcmYuYmFzZVN1cmZhY2UgaW5zdGFuY2VvZiBIVE1MQ2FudmFzRWxlbWVudCk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHNyZi5iYXNlU3VyZmFjZS5oZWlnaHQgPSA0NDUpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhzcmYuYmFzZVN1cmZhY2Uud2lkdGggPT09IDE4Mik7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHNyZi5yZWdpb25zW1wiY29sbGlzaW9uMTBcIl0ubmFtZSA9PT0gXCJQb255dGFpbFwiKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2soc3JmLmFuaW1hdGlvbnNbXCJhbmltYXRpb24zMFwiXS5pbnRlcnZhbCA9PT0gXCJiaW5kXCIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBRVW5pdC50ZXN0KFwic2hlbGwuc3VyZmFjZXMuc3VyZmFjZTEwXCIsIGZ1bmN0aW9uIChhc3NlcnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3JmID0gc2hlbGwyLnN1cmZhY2VzLnN1cmZhY2VzW1wic3VyZmFjZTEwXCJdO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhzcmYuaXMgPT09IDEwKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2soc3JmLmJhc2VTdXJmYWNlIGluc3RhbmNlb2YgSFRNTENhbnZhc0VsZW1lbnQpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhzcmYuYmFzZVN1cmZhY2UuaGVpZ2h0ID09PSAyMTApO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhzcmYuYmFzZVN1cmZhY2Uud2lkdGggPT09IDIzMCk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHNyZi5yZWdpb25zW1wiY29sbGlzaW9uMFwiXS5uYW1lID09PSBcIlNjcmVlblwiKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2soc3JmLmFuaW1hdGlvbnNbXCJhbmltYXRpb24yMFwiXS5pbnRlcnZhbCA9PT0gXCJiaW5kXCIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBRVW5pdC50ZXN0KFwiZHJhdyBzdXJmYWNlMFwiLCBmdW5jdGlvbiAoYXNzZXJ0KSB7XG4gICAgICAgICAgICAgICAgdmFyIGNudiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XG4gICAgICAgICAgICAgICAgdmFyIHNyZiA9IHNoZWxsMi5hdHRhY2hTdXJmYWNlKGNudiwgMCwgMCk7XG4gICAgICAgICAgICAgICAgc3JmLmlzUmVnaW9uVmlzaWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kaXIoc3JmKTtcbiAgICAgICAgICAgICAgICBzcmYuYmluZCgzMCk7XG4gICAgICAgICAgICAgICAgc3JmLmJpbmQoMzEpO1xuICAgICAgICAgICAgICAgIHNyZi5iaW5kKDMyKTtcbiAgICAgICAgICAgICAgICBzcmYuYmluZCg1MCk7XG4gICAgICAgICAgICAgICAgc2V0UGljdHVyZUZyYW1lKGFzc2VydC50ZXN0LnRlc3ROYW1lLCBjbnYpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayh0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgUVVuaXQudGVzdChcImRyYXcgc3VyZmFjZTEwXCIsIGZ1bmN0aW9uIChhc3NlcnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgY252ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcbiAgICAgICAgICAgICAgICB2YXIgc3JmID0gc2hlbGwyLmF0dGFjaFN1cmZhY2UoY252LCAxLCAxMCk7XG4gICAgICAgICAgICAgICAgc3JmLmlzUmVnaW9uVmlzaWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kaXIoc3JmKTtcbiAgICAgICAgICAgICAgICBzZXRQaWN0dXJlRnJhbWUoYXNzZXJ0LnRlc3QudGVzdE5hbWUsIGNudik7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHRydWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBkb25lMSgpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBmdW5jdGlvbiBzZXRQaWN0dXJlRnJhbWUodGl0bGUsIGNudikge1xuICAgICAgICB2YXIgZmllbGRzZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZmllbGRzZXRcIik7XG4gICAgICAgIHZhciBsZWdlbmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGVnZW5kXCIpO1xuICAgICAgICBsZWdlbmQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGl0bGUpKTtcbiAgICAgICAgZmllbGRzZXQuYXBwZW5kQ2hpbGQoY252KTtcbiAgICAgICAgZmllbGRzZXQuYXBwZW5kQ2hpbGQobGVnZW5kKTtcbiAgICAgICAgZmllbGRzZXQuc3R5bGUuZGlzcGxheSA9IFwiaW5saW5lLWJsb2NrXCI7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZmllbGRzZXQpO1xuICAgIH1cbn0pO1xuUVVuaXQubW9kdWxlKFwiY3V0dGxlYm9uZS5CYWxsb29uXCIpO1xucHJtTmFyLnRoZW4oZnVuY3Rpb24gKG5hbmlrYURpcikge1xuICAgIC8vY29uc29sZS5kaXIobmFuaWthRGlyKTtcbn0pO1xuIl19

