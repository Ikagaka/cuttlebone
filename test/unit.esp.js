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
                assert.ok(assert._expr(assert._capt(srf.baseSurface.height = 445, 'arguments/0'), {
                    content: 'assert.ok(srf.baseSurface.height = 445)',
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
                assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(assert._capt(srf, 'arguments/0/left/object/object').baseSurface, 'arguments/0/left/object').height, 'arguments/0/left') === 445, 'arguments/0'), {
                    content: 'assert.ok(srf.baseSurface.height === 445)',
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
            done1();
        });
    });
});
QUnit.module('cuttlebone.Balloon');
prmNar.then(function (nanikaDir) {
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvdW5pdC5qcyJdLCJuYW1lcyI6WyJwcm1OYXIiLCJOYXJMb2FkZXIiLCJsb2FkRnJvbVVSTCIsInRoZW4iLCJuYW5pa2FEaXIiLCJRVW5pdCIsIm1vZHVsZSIsInNoZWxsRGlyIiwiZ2V0RGlyZWN0b3J5IiwiYXNBcnJheUJ1ZmZlciIsImNvbnNvbGUiLCJkaXIiLCJ0ZXN0IiwiYXNzZXJ0IiwiZG9uZTEiLCJhc3luYyIsInNoZWxsMSIsImN1dHRsZWJvbmUiLCJTaGVsbCIsIm9rIiwiX2V4cHIiLCJfY2FwdCIsImNvbnRlbnQiLCJmaWxlcGF0aCIsImxpbmUiLCJsb2FkIiwic2hlbGwyIiwiZGVzY3JpcHQiLCJzdXJmYWNlcyIsImNoYXJzZXQiLCJ2ZXJzaW9uIiwic3JmIiwiaXMiLCJiYXNlU3VyZmFjZSIsIkhUTUxDYW52YXNFbGVtZW50IiwiaGVpZ2h0Iiwid2lkdGgiLCJyZWdpb25zIiwibmFtZSIsImFuaW1hdGlvbnMiLCJpbnRlcnZhbCJdLCJtYXBwaW5ncyI6IkFBR0EsSUFBSUEsTUFBQSxHQUFTQyxTQUFBLENBQVVDLFdBQVYsQ0FBc0IseUJBQXRCLENBQWI7QUFDQUYsTUFBQSxDQUFPRyxJQUFQLENBQVksVUFBVUMsU0FBVixFQUFxQjtBQUFBLElBQzdCQyxLQUFBLENBQU1DLE1BQU4sQ0FBYSxrQkFBYixFQUQ2QjtBQUFBLElBRTdCLElBQUlDLFFBQUEsR0FBV0gsU0FBQSxDQUFVSSxZQUFWLENBQXVCLGNBQXZCLEVBQXVDQyxhQUF2QyxFQUFmLENBRjZCO0FBQUEsSUFHN0JDLE9BQUEsQ0FBUUMsR0FBUixDQUFZSixRQUFaLEVBSDZCO0FBQUEsSUFJN0JGLEtBQUEsQ0FBTU8sSUFBTixDQUFXLFlBQVgsRUFBeUIsVUFBVUMsTUFBVixFQUFrQjtBQUFBLFFBQ3ZDLElBQUlDLEtBQUEsR0FBUUQsTUFBQSxDQUFPRSxLQUFQLEVBQVosQ0FEdUM7QUFBQSxRQUV2QyxJQUFJQyxNQUFBLEdBQVMsSUFBSUMsVUFBQSxDQUFXQyxLQUFmLENB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O0FBQUEsZ0JBT3JEWCxNQUFBLENBQU9NLEVBQVAsQ0FBVU4sTUFBQSxDQUFBTyxLQUFBLENBQUFQLE1BQUEsQ0FBQVEsS0FBQSxDQUFBUixNQUFBLENBQUFRLEtBQUEsQ0FBQVIsTUFBQSxDQUFBUSxLQUFBLENBQUFSLE1BQUEsQ0FBQVEsS0FBQSxDQUFBUixNQUFBLENBQUFRLEtBQUEsQ0FBQVUsR0FBQSwyQ0FBSVEsVUFBSixvQ0FBZSxhQUFmLDhCQUE4QkMsUUFBOUIsMEJBQTJDLE1BQTNDO0FBQUEsb0JBQUFsQixPQUFBO0FBQUEsb0JBQUFDLFFBQUE7QUFBQSxvQkFBQUMsSUFBQTtBQUFBLGtCQUFWLEVBUHFEO0FBQUEsYUFBekQsRUE1QmlDO0FBQUEsWUFxQ2pDVixLQUFBLEdBckNpQztBQUFBLFNBQXJDLEVBSnVDO0FBQUEsS0FBM0MsRUFKNkI7QUFBQSxDQUFqQyxFQURBO0FBa0RBVCxLQUFBLENBQU1DLE1BQU4sQ0FBYSxvQkFBYixFQWxEQTtBQW1EQU4sTUFBQSxDQUFPRyxJQUFQLENBQVksVUFBVUMsU0FBVixFQUFxQjtBQUFBLENBQWpDIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGluZ3MvdHNkLmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3RzZC9OYXJMb2FkZXIvTmFyTG9hZGVyLmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3RzZC9jdXR0bGVib25lL2N1dHRsZWJvbmUuZC50c1wiIC8+XG52YXIgcHJtTmFyID0gTmFyTG9hZGVyLmxvYWRGcm9tVVJMKFwiLi4vbmFyL21vYmlsZW1hc3Rlci5uYXJcIik7XG5wcm1OYXIudGhlbihmdW5jdGlvbiAobmFuaWthRGlyKSB7XG4gICAgUVVuaXQubW9kdWxlKFwiY3V0dGxlYm9uZS5TaGVsbFwiKTtcbiAgICB2YXIgc2hlbGxEaXIgPSBuYW5pa2FEaXIuZ2V0RGlyZWN0b3J5KFwic2hlbGwvbWFzdGVyXCIpLmFzQXJyYXlCdWZmZXIoKTtcbiAgICBjb25zb2xlLmRpcihzaGVsbERpcik7XG4gICAgUVVuaXQudGVzdChcInNoZWxsI2xvYWRcIiwgZnVuY3Rpb24gKGFzc2VydCkge1xuICAgICAgICB2YXIgZG9uZTEgPSBhc3NlcnQuYXN5bmMoKTtcbiAgICAgICAgdmFyIHNoZWxsMSA9IG5ldyBjdXR0bGVib25lLlNoZWxsKHNoZWxsRGlyKTtcbiAgICAgICAgYXNzZXJ0Lm9rKHNoZWxsMSBpbnN0YW5jZW9mIGN1dHRsZWJvbmUuU2hlbGwpO1xuICAgICAgICBzaGVsbDEubG9hZCgpLnRoZW4oZnVuY3Rpb24gKHNoZWxsMikge1xuICAgICAgICAgICAgY29uc29sZS5kaXIoc2hlbGwyKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhzaGVsbDIgPT09IHNoZWxsMSk7XG4gICAgICAgICAgICBRVW5pdC50ZXN0KFwic2hlbGwuZGVzY3JpcHRcIiwgZnVuY3Rpb24gKGFzc2VydCkge1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhzaGVsbDIuZGVzY3JpcHRbXCJrZXJvLmJpbmRncm91cDIwLm5hbWVcIl0gPT09IFwi6KOF5YKZLOmjm+ihjOijheWCmVwiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgUVVuaXQudGVzdChcInNoZWxsLnN1cmZhY2VzXCIsIGZ1bmN0aW9uIChhc3NlcnQpIHtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2soc2hlbGwyLnN1cmZhY2VzLmNoYXJzZXQgPT09IFwiU2hpZnRfSklTXCIpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhzaGVsbDIuc3VyZmFjZXMuZGVzY3JpcHQudmVyc2lvbiA9PT0gMSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFFVbml0LnRlc3QoXCJzaGVsbC5zdXJmYWNlcy5zdXJmYWNlMFwiLCBmdW5jdGlvbiAoYXNzZXJ0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHNyZiA9IHNoZWxsMi5zdXJmYWNlcy5zdXJmYWNlc1tcInN1cmZhY2UwXCJdO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhzcmYuaXMgPT09IDApO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhzcmYuYmFzZVN1cmZhY2UgaW5zdGFuY2VvZiBIVE1MQ2FudmFzRWxlbWVudCk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHNyZi5iYXNlU3VyZmFjZS5oZWlnaHQgPSA0NDUpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhzcmYuYmFzZVN1cmZhY2Uud2lkdGggPT09IDE4Mik7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHNyZi5yZWdpb25zW1wiY29sbGlzaW9uMFwiXS5uYW1lID09PSBcIkhlYWRcIik7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHNyZi5hbmltYXRpb25zW1wiYW5pbWF0aW9uMFwiXS5pbnRlcnZhbCA9PT0gXCJwZXJpb2RpYyw1XCIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBRVW5pdC50ZXN0KFwic2hlbGwuc3VyZmFjZXMuc3VyZmFjZTJcIiwgZnVuY3Rpb24gKGFzc2VydCkge1xuICAgICAgICAgICAgICAgIHZhciBzcmYgPSBzaGVsbDIuc3VyZmFjZXMuc3VyZmFjZXNbXCJzdXJmYWNlMlwiXTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2soc3JmLmlzID09PSAyKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2soc3JmLmJhc2VTdXJmYWNlIGluc3RhbmNlb2YgSFRNTENhbnZhc0VsZW1lbnQpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhzcmYuYmFzZVN1cmZhY2UuaGVpZ2h0ID0gNDQ1KTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2soc3JmLmJhc2VTdXJmYWNlLndpZHRoID09PSAxODIpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhzcmYucmVnaW9uc1tcImNvbGxpc2lvbjEwXCJdLm5hbWUgPT09IFwiUG9ueXRhaWxcIik7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHNyZi5hbmltYXRpb25zW1wiYW5pbWF0aW9uMzBcIl0uaW50ZXJ2YWwgPT09IFwiYmluZFwiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgUVVuaXQudGVzdChcInNoZWxsLnN1cmZhY2VzLnN1cmZhY2UxMFwiLCBmdW5jdGlvbiAoYXNzZXJ0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHNyZiA9IHNoZWxsMi5zdXJmYWNlcy5zdXJmYWNlc1tcInN1cmZhY2UxMFwiXTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2soc3JmLmlzID09PSAxMCk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHNyZi5iYXNlU3VyZmFjZSBpbnN0YW5jZW9mIEhUTUxDYW52YXNFbGVtZW50KTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2soc3JmLmJhc2VTdXJmYWNlLmhlaWdodCA9PT0gNDQ1KTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2soc3JmLmJhc2VTdXJmYWNlLndpZHRoID09PSAyMzApO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhzcmYucmVnaW9uc1tcImNvbGxpc2lvbjBcIl0ubmFtZSA9PT0gXCJTY3JlZW5cIik7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHNyZi5hbmltYXRpb25zW1wiYW5pbWF0aW9uMjBcIl0uaW50ZXJ2YWwgPT09IFwiYmluZFwiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZG9uZTEoKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTtcblFVbml0Lm1vZHVsZShcImN1dHRsZWJvbmUuQmFsbG9vblwiKTtcbnBybU5hci50aGVuKGZ1bmN0aW9uIChuYW5pa2FEaXIpIHtcbiAgICAvL2NvbnNvbGUuZGlyKG5hbmlrYURpcik7XG59KTtcbiJdfQ==

