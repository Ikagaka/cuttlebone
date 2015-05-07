var cuttlebone;
(function (cuttlebone) {
    var SurfaceUtil;
    (function (SurfaceUtil) {
        function choice(arr) {
            return arr[Math.round(Math.random() * (arr.length - 1))];
        }
        SurfaceUtil.choice = choice;
        function copy(cnv) {
            var copy = document.createElement('canvas');
            var ctx = copy.getContext('2d');
            copy.width = cnv.width;
            copy.height = cnv.height;
            ctx.drawImage(cnv, 0, 0);
            return copy;
        }
        SurfaceUtil.copy = copy;
        function fetchImageFromArrayBuffer(buffer, mimetype) {
            var url = URL.createObjectURL(new Blob([buffer], { type: mimetype || 'image/png' }));
            return fetchImageFromURL(url).then(function (img) {
                URL.revokeObjectURL(url);
                return Promise.resolve(img);
            });
        }
        SurfaceUtil.fetchImageFromArrayBuffer = fetchImageFromArrayBuffer;
        function fetchImageFromURL(url) {
            var img = new Image();
            img.src = url;
            return new Promise(function (resolve, reject) {
                img.addEventListener('load', function () {
                    resolve(Promise.resolve(img));
                });
                img.addEventListener('error', function (ev) {
                    reject(ev.error);
                });
            });
        }
        SurfaceUtil.fetchImageFromURL = fetchImageFromURL;
        function random(callback, probability) {
            var ms = 1;
            while (Math.round(Math.random() * 1000) > 1000 / probability) {
                ms++;
            }
            setTimeout(function () {
                return callback(function () {
                    return random(callback, probability);
                });
            }, ms * 1000);
        }
        SurfaceUtil.random = random;
        function periodic(callback, sec) {
            setTimeout(function () {
                return callback(function () {
                    return periodic(callback, sec);
                });
            }, sec * 1000);
        }
        SurfaceUtil.periodic = periodic;
        function always(callback) {
            callback(function () {
                return always(callback);
            });
        }
        SurfaceUtil.always = always;
        function isHit(cnv, x, y) {
            var ctx = cnv.getContext('2d');
            var imgdata = ctx.getImageData(0, 0, x + 1, y + 1);
            var data = imgdata.data;
            return data[data.length - 1] !== 0;
        }
        SurfaceUtil.isHit = isHit;
        function offset(element) {
            var obj = element.getBoundingClientRect();
            return {
                left: obj.left + window.pageXOffset,
                top: obj.top + window.pageYOffset,
                width: Math.round(obj.width),
                height: Math.round(obj.height)
            };
        }
        SurfaceUtil.offset = offset;
        function elementFromPointWithout(element, pageX, pageY) {
            var tmp = element.style.display;
            element.style.display = 'none';
            var elm = document.elementFromPoint(pageX, pageY);
            if (elm instanceof HTMLCanvasElement) {
                var _a = offset(elm), top = _a.top, left = _a.left;
                if (isHit(elm, pageX - left, pageY - top)) {
                    element.style.display = tmp;
                    return elm;
                }
            }
            if (elm instanceof HTMLElement) {
                var _elm = elementFromPointWithout(elm, pageX, pageY);
                element.style.display = tmp;
                return _elm;
            }
            console.warn(elm);
            element.style.display = tmp;
            return null;
        }
        SurfaceUtil.elementFromPointWithout = elementFromPointWithout;
    }(SurfaceUtil = cuttlebone.SurfaceUtil || (cuttlebone.SurfaceUtil = {})));
}(cuttlebone || (cuttlebone = {})));
var cuttlebone;
(function (cuttlebone) {
    var SurfaceRender = function () {
        function SurfaceRender(cnv) {
            this.cnv = cnv;
            this.ctx = cnv.getContext('2d');
        }
        SurfaceRender.prototype.composeElements = function (elements) {
            if (elements.length === 0) {
                return;
            }
            var _a = elements[0], canvas = _a.canvas, type = _a.type, x = _a.x, y = _a.y;
            var offsetX = 0;
            var offsetY = 0;
            switch (type) {
            case 'base':
                this.base(canvas, offsetX, offsetY);
                break;
            case 'overlay':
                this.overlay(canvas, offsetX + x, offsetY + y);
                break;
            case 'overlayfast':
                this.overlayfast(canvas, offsetX + x, offsetY + y);
                break;
            case 'replace':
                this.replace(canvas, offsetX + x, offsetY + y);
                break;
            case 'add':
                this.overlayfast(canvas, offsetX + x, offsetY + y);
                break;
            case 'bind':
                this.overlayfast(canvas, offsetX + x, offsetY + y);
                break;
            case 'interpolate':
                this.interpolate(canvas, offsetX + x, offsetY + y);
                break;
            case 'move':
                offsetX = x;
                offsetY = y;
                var copyed = cuttlebone.SurfaceUtil.copy(this.cnv);
                this.base(copyed, offsetX, offsetY);
                break;
            default:
                console.error(elements[0]);
            }
            this.composeElements(elements.slice(1));
        };
        SurfaceRender.prototype.clear = function () {
            this.cnv.width = this.cnv.width;
        };
        SurfaceRender.prototype.chromakey = function () {
            var ctx = this.cnv.getContext('2d');
            var imgdata = ctx.getImageData(0, 0, this.cnv.width, this.cnv.height);
            var data = imgdata.data;
            var r = data[0], g = data[1], b = data[2], a = data[3];
            var i = 0;
            if (a !== 0) {
                while (i < data.length) {
                    if (r === data[i] && g === data[i + 1] && b === data[i + 2]) {
                        data[i + 3] = 0;
                    }
                    i += 4;
                }
            }
            ctx.putImageData(imgdata, 0, 0);
        };
        SurfaceRender.prototype.pna = function (pna) {
            var ctxB = pna.getContext('2d');
            var imgdataA = this.ctx.getImageData(0, 0, this.cnv.width, this.cnv.height);
            var imgdataB = ctxB.getImageData(0, 0, pna.width, pna.height);
            var dataA = imgdataA.data;
            var dataB = imgdataB.data;
            var i = 0;
            while (i < dataA.length) {
                dataA[i + 3] = dataB[i];
                i += 4;
            }
            this.ctx.putImageData(imgdataA, 0, 0);
        };
        SurfaceRender.prototype.base = function (part, x, y) {
            this.clear();
            this.init(part);
        };
        SurfaceRender.prototype.overlay = function (part, x, y) {
            if (this.cnv.width < part.width || this.cnv.height < part.height) {
                this.base(part, x, y);
            } else {
                this.overlayfast(part, x, y);
            }
        };
        SurfaceRender.prototype.overlayfast = function (part, x, y) {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.drawImage(part, x, y);
        };
        SurfaceRender.prototype.interpolate = function (part, x, y) {
            this.ctx.globalCompositeOperation = 'destination-over';
            this.ctx.drawImage(part, x, y);
        };
        SurfaceRender.prototype.replace = function (part, x, y) {
            this.ctx.clearRect(x, y, part.width, part.height);
            this.overlayfast(part, x, y);
        };
        SurfaceRender.prototype.init = function (cnv) {
            this.cnv.width = cnv.width;
            this.cnv.height = cnv.height;
            this.overlayfast(cnv, 0, 0);
        };
        SurfaceRender.prototype.drawRegion = function (region) {
            var type = region.type, name = region.name, left = region.left, top = region.top, right = region.right, bottom = region.bottom, coordinates = region.coordinates, radius = region.radius, center_x = region.center_x, center_y = region.center_y;
            this.ctx.strokeStyle = '#00FF00';
            switch (type) {
            case 'rect':
                this.ctx.rect(left, top, right - left, bottom - top);
                break;
            case 'ellipse':
                this.ctx.rect(left, top, right - left, bottom - top);
                break;
            case 'circle':
                this.ctx.rect(left, top, right - left, bottom - top);
                break;
            case 'polygon':
                this.ctx.rect(left, top, right - left, bottom - top);
            }
            this.ctx.stroke();
            this.ctx.font = '35px';
            this.ctx.strokeStyle = 'white';
            this.ctx.strokeText(type + ':' + name, left + 5, top + 10);
            this.ctx.fillStyle = 'black';
            this.ctx.fillText(type + ':' + name, left + 5, top + 10);
        };
        return SurfaceRender;
    }();
    cuttlebone.SurfaceRender = SurfaceRender;
}(cuttlebone || (cuttlebone = {})));
var cuttlebone;
(function (cuttlebone) {
    ;
    var SurfaceCacheManager = function () {
        function SurfaceCacheManager(surfaces, directory) {
            this.surfaces = surfaces;
            this.directory = directory;
            this.baseSurfaceCaches = [];
        }
        SurfaceCacheManager.prototype.load = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                resolve(Promise.resolve(_this));
            });
        };
        SurfaceCacheManager.prototype.isCached = function (surfaceId) {
            return !!this.baseSurfaceCaches[surfaceId];
        };
        SurfaceCacheManager.prototype.getSurfaceFilename = function (surfaceId) {
            var reg = /^surface(\d+)\.png$/i;
            return Object.keys(this.directory).filter(function (filename) {
                return reg.test(filename);
            }).filter(function (filename) {
                return surfaceId === Number(reg.exec(filename)[1]);
            })[0] || '';
        };
        SurfaceCacheManager.prototype.getPNAFilename = function (filename) {
            var pnafilename = filename.replace(/\.png$/i, '.pna');
            var reg = new RegExp(pnafilename, 'i');
            return Object.keys(this.directory).filter(function (filename) {
                return reg.test(filename);
            })[0] || '';
        };
        SurfaceCacheManager.prototype.getSurfaceDefinition = function (surfaceId) {
            var _this = this;
            return Object.keys(this.surfaces).filter(function (key) {
                return _this.surfaces[key].is === surfaceId;
            })[0];
        };
        SurfaceCacheManager.prototype.fetchSurfaceImage = function (filename) {
            var _this = this;
            var pnafilename = this.getPNAFilename(filename);
            var cnv = document.createElement('canvas');
            cnv.width = 0;
            cnv.height = 0;
            var render = new cuttlebone.SurfaceRender(cnv);
            return new Promise(function (resolve, reject) {
                cuttlebone.SurfaceUtil.fetchImageFromArrayBuffer(_this.directory[filename]).then(function (img) {
                    render.init(img);
                    if (pnafilename.length === 0) {
                        render.chromakey();
                        return resolve(Promise.resolve(render));
                    }
                    cuttlebone.SurfaceUtil.fetchImageFromArrayBuffer(_this.directory[pnafilename]).then(function (pna) {
                        render.pna(cuttlebone.SurfaceUtil.copy(pna));
                        resolve(Promise.resolve(render));
                    });
                });
            });
        };
        SurfaceCacheManager.prototype.fetchBaseSurface = function (surfaceId) {
            var _this = this;
            if (this.isCached(surfaceId)) {
                return Promise.resolve(this.baseSurfaceCaches[surfaceId]);
            }
            var surfaceDef = this.getSurfaceDefinition(surfaceId);
            var baseSurfaceFilename = this.getSurfaceFilename(surfaceId);
            return this.fetchSurfaceImage(baseSurfaceFilename).then(function (render) {
                _this.baseSurfaceCaches[surfaceId] = render.cnv;
                return Promise.resolve(_this.baseSurfaceCaches[surfaceId]);
            });
        };
        return SurfaceCacheManager;
    }();
    cuttlebone.SurfaceCacheManager = SurfaceCacheManager;
}(cuttlebone || (cuttlebone = {})));
var prmNar = NarLoader.loadFromURL('../nar/mobilemaster.nar');
prmNar.then(function (nanikaDir) {
    QUnit.module('cuttlebone.SurfaceCacheManager');
    var shellDir = nanikaDir.getDirectory('shell/master').asArrayBuffer();
    console.log(shellDir);
    var filenames = Object.keys(shellDir).filter(function (filename) {
        return /surfaces\S*\.txt$/.test(filename);
    });
    console.log(filenames);
    var cated = filenames.reduce(function (str, filename) {
        return str + Encoding.codeToString(Encoding.convert(new Uint8Array(shellDir[filename]), 'UNICODE', 'AUTO'));
    }, '');
    var surfaces = SurfacesTxt2Yaml.txt_to_data(cated, { compatible: 'ssp-lazy' });
    console.log(surfaces);
    var srfMgr = new cuttlebone.SurfaceCacheManager(surfaces, shellDir);
    console.log(srfMgr);
    QUnit.test('SurfaceCacheManager#isCached', function (assert) {
        assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(srfMgr, 'arguments/0/left/callee/object').isCached(0), 'arguments/0/left') === false, 'arguments/0'), {
            content: 'assert.ok(srfMgr.isCached(0) === false)',
            filepath: 'test/unit.js',
            line: 341
        }));
    });
    QUnit.test('SurfaceCacheManager#getSurfaceFilename', function (assert) {
        assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(srfMgr, 'arguments/0/left/callee/object').getSurfaceFilename(0), 'arguments/0/left') === 'surface0.png', 'arguments/0'), {
            content: 'assert.ok(srfMgr.getSurfaceFilename(0) === "surface0.png")',
            filepath: 'test/unit.js',
            line: 344
        }));
    });
    QUnit.test('SurfaceCacheManager#getSurfaceFilename', function (assert) {
        assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(srfMgr, 'arguments/0/left/callee/object').getSurfaceFilename(0), 'arguments/0/left') === 'surface0.png', 'arguments/0'), {
            content: 'assert.ok(srfMgr.getSurfaceFilename(0) === "surface0.png")',
            filepath: 'test/unit.js',
            line: 347
        }));
    });
    QUnit.test('SurfaceCacheManager#getPNAFilename', function (assert) {
        assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(srfMgr, 'arguments/0/left/callee/object').getPNAFilename(assert._capt(assert._capt(srfMgr, 'arguments/0/left/arguments/0/callee/object').getSurfaceFilename(731), 'arguments/0/left/arguments/0')), 'arguments/0/left') === 'surface731.pna', 'arguments/0'), {
            content: 'assert.ok(srfMgr.getPNAFilename(srfMgr.getSurfaceFilename(731)) === "surface731.pna")',
            filepath: 'test/unit.js',
            line: 350
        }));
    });
    QUnit.test('SurfaceCacheManager#getSurfaceDefinition', function (assert) {
        assert.ok(assert._expr(assert._capt(assert._capt(assert._capt(assert._capt(srfMgr, 'arguments/0/left/object/callee/object').getSurfaceDefinition(0), 'arguments/0/left/object')._is, 'arguments/0/left') === 0, 'arguments/0'), {
            content: 'assert.ok(srfMgr.getSurfaceDefinition(0)._is === 0)',
            filepath: 'test/unit.js',
            line: 353
        }));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvdW5pdC5qcyJdLCJuYW1lcyI6WyJjdXR0bGVib25lIiwiU3VyZmFjZVV0aWwiLCJjaG9pY2UiLCJhcnIiLCJNYXRoIiwicm91bmQiLCJyYW5kb20iLCJsZW5ndGgiLCJjb3B5IiwiY252IiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiY3R4IiwiZ2V0Q29udGV4dCIsIndpZHRoIiwiaGVpZ2h0IiwiZHJhd0ltYWdlIiwiZmV0Y2hJbWFnZUZyb21BcnJheUJ1ZmZlciIsImJ1ZmZlciIsIm1pbWV0eXBlIiwidXJsIiwiVVJMIiwiY3JlYXRlT2JqZWN0VVJMIiwiQmxvYiIsInR5cGUiLCJmZXRjaEltYWdlRnJvbVVSTCIsInRoZW4iLCJpbWciLCJyZXZva2VPYmplY3RVUkwiLCJQcm9taXNlIiwicmVzb2x2ZSIsIkltYWdlIiwic3JjIiwicmVqZWN0IiwiYWRkRXZlbnRMaXN0ZW5lciIsImV2IiwiZXJyb3IiLCJjYWxsYmFjayIsInByb2JhYmlsaXR5IiwibXMiLCJzZXRUaW1lb3V0IiwicGVyaW9kaWMiLCJzZWMiLCJhbHdheXMiLCJpc0hpdCIsIngiLCJ5IiwiaW1nZGF0YSIsImdldEltYWdlRGF0YSIsImRhdGEiLCJvZmZzZXQiLCJlbGVtZW50Iiwib2JqIiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwibGVmdCIsIndpbmRvdyIsInBhZ2VYT2Zmc2V0IiwidG9wIiwicGFnZVlPZmZzZXQiLCJlbGVtZW50RnJvbVBvaW50V2l0aG91dCIsInBhZ2VYIiwicGFnZVkiLCJ0bXAiLCJzdHlsZSIsImRpc3BsYXkiLCJlbG0iLCJlbGVtZW50RnJvbVBvaW50IiwiSFRNTENhbnZhc0VsZW1lbnQiLCJfYSIsIkhUTUxFbGVtZW50IiwiX2VsbSIsImNvbnNvbGUiLCJ3YXJuIiwiU3VyZmFjZVJlbmRlciIsInByb3RvdHlwZSIsImNvbXBvc2VFbGVtZW50cyIsImVsZW1lbnRzIiwiY2FudmFzIiwib2Zmc2V0WCIsIm9mZnNldFkiLCJiYXNlIiwib3ZlcmxheSIsIm92ZXJsYXlmYXN0IiwicmVwbGFjZSIsImludGVycG9sYXRlIiwiY29weWVkIiwic2xpY2UiLCJjbGVhciIsImNocm9tYWtleSIsInIiLCJnIiwiYiIsImEiLCJpIiwicHV0SW1hZ2VEYXRhIiwicG5hIiwiY3R4QiIsImltZ2RhdGFBIiwiaW1nZGF0YUIiLCJkYXRhQSIsImRhdGFCIiwicGFydCIsImluaXQiLCJnbG9iYWxDb21wb3NpdGVPcGVyYXRpb24iLCJjbGVhclJlY3QiLCJkcmF3UmVnaW9uIiwicmVnaW9uIiwibmFtZSIsInJpZ2h0IiwiYm90dG9tIiwiY29vcmRpbmF0ZXMiLCJyYWRpdXMiLCJjZW50ZXJfeCIsImNlbnRlcl95Iiwic3Ryb2tlU3R5bGUiLCJyZWN0Iiwic3Ryb2tlIiwiZm9udCIsInN0cm9rZVRleHQiLCJmaWxsU3R5bGUiLCJmaWxsVGV4dCIsIlN1cmZhY2VDYWNoZU1hbmFnZXIiLCJzdXJmYWNlcyIsImRpcmVjdG9yeSIsImJhc2VTdXJmYWNlQ2FjaGVzIiwibG9hZCIsIl90aGlzIiwiaXNDYWNoZWQiLCJzdXJmYWNlSWQiLCJnZXRTdXJmYWNlRmlsZW5hbWUiLCJyZWciLCJPYmplY3QiLCJrZXlzIiwiZmlsdGVyIiwiZmlsZW5hbWUiLCJ0ZXN0IiwiTnVtYmVyIiwiZXhlYyIsImdldFBOQUZpbGVuYW1lIiwicG5hZmlsZW5hbWUiLCJSZWdFeHAiLCJnZXRTdXJmYWNlRGVmaW5pdGlvbiIsImtleSIsImlzIiwiZmV0Y2hTdXJmYWNlSW1hZ2UiLCJyZW5kZXIiLCJmZXRjaEJhc2VTdXJmYWNlIiwic3VyZmFjZURlZiIsImJhc2VTdXJmYWNlRmlsZW5hbWUiLCJwcm1OYXIiLCJOYXJMb2FkZXIiLCJsb2FkRnJvbVVSTCIsIm5hbmlrYURpciIsIlFVbml0IiwibW9kdWxlIiwic2hlbGxEaXIiLCJnZXREaXJlY3RvcnkiLCJhc0FycmF5QnVmZmVyIiwibG9nIiwiZmlsZW5hbWVzIiwiY2F0ZWQiLCJyZWR1Y2UiLCJzdHIiLCJFbmNvZGluZyIsImNvZGVUb1N0cmluZyIsImNvbnZlcnQiLCJVaW50OEFycmF5IiwiU3VyZmFjZXNUeHQyWWFtbCIsInR4dF90b19kYXRhIiwiY29tcGF0aWJsZSIsInNyZk1nciIsImFzc2VydCIsIm9rIiwiX2V4cHIiLCJfY2FwdCIsImNvbnRlbnQiLCJmaWxlcGF0aCIsImxpbmUiLCJfaXMiXSwibWFwcGluZ3MiOiJBQUNBLElBQUlBLFVBQUo7QUFDQSxDQUFDLFVBQVVBLFVBQVYsRUFBc0I7QUFBQSxJQUNuQixJQUFJQyxXQUFKLENBRG1CO0FBQUEsSUFFbkIsQ0FBQyxVQUFVQSxXQUFWLEVBQXVCO0FBQUEsUUFDcEIsU0FBU0MsTUFBVCxDQUFnQkMsR0FBaEIsRUFBcUI7QUFBQSxZQUNqQixPQUFPQSxHQUFBLENBQUlDLElBQUEsQ0FBS0MsS0FBTCxDQUFXRCxJQUFBLENBQUtFLE1BQUwsS0FBaUIsQ0FBQUgsR0FBQSxDQUFJSSxNQUFKLEdBQWEsQ0FBYixDQUE1QixDQUFKLENBQVAsQ0FEaUI7QUFBQSxTQUREO0FBQUEsUUFJcEJOLFdBQUEsQ0FBWUMsTUFBWixHQUFxQkEsTUFBckIsQ0FKb0I7QUFBQSxRQUtwQixTQUFTTSxJQUFULENBQWNDLEdBQWQsRUFBbUI7QUFBQSxZQUNmLElBQUlELElBQUEsR0FBT0UsUUFBQSxDQUFTQyxhQUFULENBQXVCLFFBQXZCLENBQVgsQ0FEZTtBQUFBLFlBRWYsSUFBSUMsR0FBQSxHQUFNSixJQUFBLENBQUtLLFVBQUwsQ0FBZ0IsSUFBaEIsQ0FBVixDQUZlO0FBQUEsWUFHZkwsSUFBQSxDQUFLTSxLQUFMLEdBQWFMLEdBQUEsQ0FBSUssS0FBakIsQ0FIZTtBQUFBLFlBSWZOLElBQUEsQ0FBS08sTUFBTCxHQUFjTixHQUFBLENBQUlNLE1BQWxCLENBSmU7QUFBQSxZQUtmSCxHQUFBLENBQUlJLFNBQUosQ0FBY1AsR0FBZCxFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUxlO0FBQUEsWUFNZixPQUFPRCxJQUFQLENBTmU7QUFBQSxTQUxDO0FBQUEsUUFhcEJQLFdBQUEsQ0FBWU8sSUFBWixHQUFtQkEs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LE1BQUEsMkNBQU83QixvQkFBUCxDQUE0QixDQUE1Qiw4QkFBK0JxQyxHQUEvQiwwQkFBdUMsQ0FBdkM7QUFBQSxZQUFBSCxPQUFBO0FBQUEsWUFBQUMsUUFBQTtBQUFBLFlBQUFDLElBQUE7QUFBQSxVQUFWLEVBRHFFO0FBQUEsS0FBekUsRUF6QjZCO0FBQUEsQ0FBakMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciBjdXR0bGVib25lO1xuKGZ1bmN0aW9uIChjdXR0bGVib25lKSB7XG4gICAgdmFyIFN1cmZhY2VVdGlsO1xuICAgIChmdW5jdGlvbiAoU3VyZmFjZVV0aWwpIHtcbiAgICAgICAgZnVuY3Rpb24gY2hvaWNlKGFycikge1xuICAgICAgICAgICAgcmV0dXJuIGFycltNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAoYXJyLmxlbmd0aCAtIDEpKV07XG4gICAgICAgIH1cbiAgICAgICAgU3VyZmFjZVV0aWwuY2hvaWNlID0gY2hvaWNlO1xuICAgICAgICBmdW5jdGlvbiBjb3B5KGNudikge1xuICAgICAgICAgICAgdmFyIGNvcHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xuICAgICAgICAgICAgdmFyIGN0eCA9IGNvcHkuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgICAgICAgICAgY29weS53aWR0aCA9IGNudi53aWR0aDtcbiAgICAgICAgICAgIGNvcHkuaGVpZ2h0ID0gY252LmhlaWdodDtcbiAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UoY252LCAwLCAwKTsgLy8gdHlwZSBoYWNrXG4gICAgICAgICAgICByZXR1cm4gY29weTtcbiAgICAgICAgfVxuICAgICAgICBTdXJmYWNlVXRpbC5jb3B5ID0gY29weTtcbiAgICAgICAgZnVuY3Rpb24gZmV0Y2hJbWFnZUZyb21BcnJheUJ1ZmZlcihidWZmZXIsIG1pbWV0eXBlKSB7XG4gICAgICAgICAgICB2YXIgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChuZXcgQmxvYihbYnVmZmVyXSwgeyB0eXBlOiBtaW1ldHlwZSB8fCBcImltYWdlL3BuZ1wiIH0pKTtcbiAgICAgICAgICAgIHJldHVybiBmZXRjaEltYWdlRnJvbVVSTCh1cmwpLnRoZW4oZnVuY3Rpb24gKGltZykge1xuICAgICAgICAgICAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwodXJsKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGltZyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBTdXJmYWNlVXRpbC5mZXRjaEltYWdlRnJvbUFycmF5QnVmZmVyID0gZmV0Y2hJbWFnZUZyb21BcnJheUJ1ZmZlcjtcbiAgICAgICAgZnVuY3Rpb24gZmV0Y2hJbWFnZUZyb21VUkwodXJsKSB7XG4gICAgICAgICAgICB2YXIgaW1nID0gbmV3IEltYWdlO1xuICAgICAgICAgICAgaW1nLnNyYyA9IHVybDtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgaW1nLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShQcm9taXNlLnJlc29sdmUoaW1nKSk7IC8vIHR5cGUgaGFja1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGltZy5hZGRFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChldi5lcnJvcik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBTdXJmYWNlVXRpbC5mZXRjaEltYWdlRnJvbVVSTCA9IGZldGNoSW1hZ2VGcm9tVVJMO1xuICAgICAgICBmdW5jdGlvbiByYW5kb20oY2FsbGJhY2ssIHByb2JhYmlsaXR5KSB7XG4gICAgICAgICAgICB2YXIgbXMgPSAxO1xuICAgICAgICAgICAgd2hpbGUgKE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIDEwMDApID4gMTAwMCAvIHByb2JhYmlsaXR5KSB7XG4gICAgICAgICAgICAgICAgbXMrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNldFRpbWVvdXQoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZnVuY3Rpb24gKCkgeyByZXR1cm4gcmFuZG9tKGNhbGxiYWNrLCBwcm9iYWJpbGl0eSk7IH0pO1xuICAgICAgICAgICAgfSksIG1zICogMTAwMCk7XG4gICAgICAgIH1cbiAgICAgICAgU3VyZmFjZVV0aWwucmFuZG9tID0gcmFuZG9tO1xuICAgICAgICBmdW5jdGlvbiBwZXJpb2RpYyhjYWxsYmFjaywgc2VjKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBlcmlvZGljKGNhbGxiYWNrLCBzZWMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSksIHNlYyAqIDEwMDApO1xuICAgICAgICB9XG4gICAgICAgIFN1cmZhY2VVdGlsLnBlcmlvZGljID0gcGVyaW9kaWM7XG4gICAgICAgIGZ1bmN0aW9uIGFsd2F5cyhjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2soZnVuY3Rpb24gKCkgeyByZXR1cm4gYWx3YXlzKGNhbGxiYWNrKTsgfSk7XG4gICAgICAgIH1cbiAgICAgICAgU3VyZmFjZVV0aWwuYWx3YXlzID0gYWx3YXlzO1xuICAgICAgICBmdW5jdGlvbiBpc0hpdChjbnYsIHgsIHkpIHtcbiAgICAgICAgICAgIHZhciBjdHggPSBjbnYuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgICAgICAgICAgdmFyIGltZ2RhdGEgPSBjdHguZ2V0SW1hZ2VEYXRhKDAsIDAsIHggKyAxLCB5ICsgMSk7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IGltZ2RhdGEuZGF0YTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhW2RhdGEubGVuZ3RoIC0gMV0gIT09IDA7XG4gICAgICAgIH1cbiAgICAgICAgU3VyZmFjZVV0aWwuaXNIaXQgPSBpc0hpdDtcbiAgICAgICAgZnVuY3Rpb24gb2Zmc2V0KGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHZhciBvYmogPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBsZWZ0OiBvYmoubGVmdCArIHdpbmRvdy5wYWdlWE9mZnNldCxcbiAgICAgICAgICAgICAgICB0b3A6IG9iai50b3AgKyB3aW5kb3cucGFnZVlPZmZzZXQsXG4gICAgICAgICAgICAgICAgd2lkdGg6IE1hdGgucm91bmQob2JqLndpZHRoKSxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IE1hdGgucm91bmQob2JqLmhlaWdodClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgU3VyZmFjZVV0aWwub2Zmc2V0ID0gb2Zmc2V0O1xuICAgICAgICBmdW5jdGlvbiBlbGVtZW50RnJvbVBvaW50V2l0aG91dChlbGVtZW50LCBwYWdlWCwgcGFnZVkpIHtcbiAgICAgICAgICAgIHZhciB0bXAgPSBlbGVtZW50LnN0eWxlLmRpc3BsYXk7XG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgIC8vIGVsZW1lbnTjgpLpnZ7ooajnpLrjgavjgZfjgabnm7TkuIvjga7opoHntKDjgpLoqr/jgbnjgotcbiAgICAgICAgICAgIHZhciBlbG0gPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KHBhZ2VYLCBwYWdlWSk7XG4gICAgICAgICAgICAvLyDnm7TkuIvjga7opoHntKDjgYxjYW52YXPjgarjgonpgI/mmI7jgYvjganjgYbjgYvoqr/jgbnjgotcbiAgICAgICAgICAgIC8vIHRvZG86IGN1dHRsZWJvbmXnrqHnkIbkuIvjga7opoHntKDjgYvjganjgYbjgYvjga7liKTlrprlv4XopoFcbiAgICAgICAgICAgIGlmIChlbG0gaW5zdGFuY2VvZiBIVE1MQ2FudmFzRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHZhciBfYSA9IG9mZnNldChlbG0pLCB0b3AgPSBfYS50b3AsIGxlZnQgPSBfYS5sZWZ0O1xuICAgICAgICAgICAgICAgIC8vIOS4jemAj+aYjuOBquOCieODkuODg+ODiFxuICAgICAgICAgICAgICAgIGlmIChpc0hpdChlbG0sIHBhZ2VYIC0gbGVmdCwgcGFnZVkgLSB0b3ApKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IHRtcDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsbTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBlbGVtZW5044Gu6Z2e6KGo56S644Gu44G+44G+44GV44KJ44Gr5LiL44Gu6KaB57Sg44KS6Kq/44G544Gr44GE44GPXG4gICAgICAgICAgICBpZiAoZWxtIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgX2VsbSA9IGVsZW1lbnRGcm9tUG9pbnRXaXRob3V0KGVsbSwgcGFnZVgsIHBhZ2VZKTtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSB0bXA7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9lbG07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDop6PmsbrjgafjgY3jgarjgYvjgaPjgZ/vvIHjgrbjg7Pjg43jg7MhXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oZWxtKTtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IHRtcDtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIFN1cmZhY2VVdGlsLmVsZW1lbnRGcm9tUG9pbnRXaXRob3V0ID0gZWxlbWVudEZyb21Qb2ludFdpdGhvdXQ7XG4gICAgfSkoU3VyZmFjZVV0aWwgPSBjdXR0bGVib25lLlN1cmZhY2VVdGlsIHx8IChjdXR0bGVib25lLlN1cmZhY2VVdGlsID0ge30pKTtcbn0pKGN1dHRsZWJvbmUgfHwgKGN1dHRsZWJvbmUgPSB7fSkpO1xuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgY3V0dGxlYm9uZTtcbihmdW5jdGlvbiAoY3V0dGxlYm9uZSkge1xuICAgIHZhciBTdXJmYWNlUmVuZGVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gU3VyZmFjZVJlbmRlcihjbnYpIHtcbiAgICAgICAgICAgIHRoaXMuY252ID0gY252O1xuICAgICAgICAgICAgdGhpcy5jdHggPSBjbnYuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgICAgICB9XG4gICAgICAgIFN1cmZhY2VSZW5kZXIucHJvdG90eXBlLmNvbXBvc2VFbGVtZW50cyA9IGZ1bmN0aW9uIChlbGVtZW50cykge1xuICAgICAgICAgICAgaWYgKGVsZW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBfYSA9IGVsZW1lbnRzWzBdLCBjYW52YXMgPSBfYS5jYW52YXMsIHR5cGUgPSBfYS50eXBlLCB4ID0gX2EueCwgeSA9IF9hLnk7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0WCA9IDA7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0WSA9IDA7XG4gICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwiYmFzZVwiOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmJhc2UoY2FudmFzLCBvZmZzZXRYLCBvZmZzZXRZKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIm92ZXJsYXlcIjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5KGNhbnZhcywgb2Zmc2V0WCArIHgsIG9mZnNldFkgKyB5KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIm92ZXJsYXlmYXN0XCI6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3ZlcmxheWZhc3QoY2FudmFzLCBvZmZzZXRYICsgeCwgb2Zmc2V0WSArIHkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwicmVwbGFjZVwiOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlcGxhY2UoY2FudmFzLCBvZmZzZXRYICsgeCwgb2Zmc2V0WSArIHkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiYWRkXCI6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3ZlcmxheWZhc3QoY2FudmFzLCBvZmZzZXRYICsgeCwgb2Zmc2V0WSArIHkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiYmluZFwiOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLm92ZXJsYXlmYXN0KGNhbnZhcywgb2Zmc2V0WCArIHgsIG9mZnNldFkgKyB5KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcImludGVycG9sYXRlXCI6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJwb2xhdGUoY2FudmFzLCBvZmZzZXRYICsgeCwgb2Zmc2V0WSArIHkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwibW92ZVwiOlxuICAgICAgICAgICAgICAgICAgICBvZmZzZXRYID0geDtcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0WSA9IHk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb3B5ZWQgPSBjdXR0bGVib25lLlN1cmZhY2VVdGlsLmNvcHkodGhpcy5jbnYpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmJhc2UoY29weWVkLCBvZmZzZXRYLCBvZmZzZXRZKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlbGVtZW50c1swXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmNvbXBvc2VFbGVtZW50cyhlbGVtZW50cy5zbGljZSgxKSk7XG4gICAgICAgIH07XG4gICAgICAgIFN1cmZhY2VSZW5kZXIucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5jbnYud2lkdGggPSB0aGlzLmNudi53aWR0aDtcbiAgICAgICAgfTtcbiAgICAgICAgU3VyZmFjZVJlbmRlci5wcm90b3R5cGUuY2hyb21ha2V5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGN0eCA9IHRoaXMuY252LmdldENvbnRleHQoXCIyZFwiKTtcbiAgICAgICAgICAgIHZhciBpbWdkYXRhID0gY3R4LmdldEltYWdlRGF0YSgwLCAwLCB0aGlzLmNudi53aWR0aCwgdGhpcy5jbnYuaGVpZ2h0KTtcbiAgICAgICAgICAgIHZhciBkYXRhID0gaW1nZGF0YS5kYXRhO1xuICAgICAgICAgICAgdmFyIHIgPSBkYXRhWzBdLCBnID0gZGF0YVsxXSwgYiA9IGRhdGFbMl0sIGEgPSBkYXRhWzNdO1xuICAgICAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICAgICAgaWYgKGEgIT09IDApIHtcbiAgICAgICAgICAgICAgICB3aGlsZSAoaSA8IGRhdGEubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyID09PSBkYXRhW2ldICYmIGcgPT09IGRhdGFbaSArIDFdICYmIGIgPT09IGRhdGFbaSArIDJdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhW2kgKyAzXSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaSArPSA0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN0eC5wdXRJbWFnZURhdGEoaW1nZGF0YSwgMCwgMCk7XG4gICAgICAgIH07XG4gICAgICAgIFN1cmZhY2VSZW5kZXIucHJvdG90eXBlLnBuYSA9IGZ1bmN0aW9uIChwbmEpIHtcbiAgICAgICAgICAgIHZhciBjdHhCID0gcG5hLmdldENvbnRleHQoXCIyZFwiKTtcbiAgICAgICAgICAgIHZhciBpbWdkYXRhQSA9IHRoaXMuY3R4LmdldEltYWdlRGF0YSgwLCAwLCB0aGlzLmNudi53aWR0aCwgdGhpcy5jbnYuaGVpZ2h0KTtcbiAgICAgICAgICAgIHZhciBpbWdkYXRhQiA9IGN0eEIuZ2V0SW1hZ2VEYXRhKDAsIDAsIHBuYS53aWR0aCwgcG5hLmhlaWdodCk7XG4gICAgICAgICAgICB2YXIgZGF0YUEgPSBpbWdkYXRhQS5kYXRhO1xuICAgICAgICAgICAgdmFyIGRhdGFCID0gaW1nZGF0YUIuZGF0YTtcbiAgICAgICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgICAgIHdoaWxlIChpIDwgZGF0YUEubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZGF0YUFbaSArIDNdID0gZGF0YUJbaV07XG4gICAgICAgICAgICAgICAgaSArPSA0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jdHgucHV0SW1hZ2VEYXRhKGltZ2RhdGFBLCAwLCAwKTtcbiAgICAgICAgfTtcbiAgICAgICAgU3VyZmFjZVJlbmRlci5wcm90b3R5cGUuYmFzZSA9IGZ1bmN0aW9uIChwYXJ0LCB4LCB5KSB7XG4gICAgICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICAgICAgICB0aGlzLmluaXQocGFydCk7XG4gICAgICAgIH07XG4gICAgICAgIFN1cmZhY2VSZW5kZXIucHJvdG90eXBlLm92ZXJsYXkgPSBmdW5jdGlvbiAocGFydCwgeCwgeSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuY252LndpZHRoIDwgcGFydC53aWR0aCB8fCB0aGlzLmNudi5oZWlnaHQgPCBwYXJ0LmhlaWdodCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYmFzZShwYXJ0LCB4LCB5KTsgLy8g5LiL44Gu44Os44Kk44Ok5raI44GI44GmcGFydOOBi+OCieaPj+eUu+OBleOCjOOCi+OCk+OBmOOCg+OBre+8n1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5ZmFzdChwYXJ0LCB4LCB5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgU3VyZmFjZVJlbmRlci5wcm90b3R5cGUub3ZlcmxheWZhc3QgPSBmdW5jdGlvbiAocGFydCwgeCwgeSkge1xuICAgICAgICAgICAgdGhpcy5jdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gXCJzb3VyY2Utb3ZlclwiO1xuICAgICAgICAgICAgdGhpcy5jdHguZHJhd0ltYWdlKHBhcnQsIHgsIHkpO1xuICAgICAgICB9O1xuICAgICAgICBTdXJmYWNlUmVuZGVyLnByb3RvdHlwZS5pbnRlcnBvbGF0ZSA9IGZ1bmN0aW9uIChwYXJ0LCB4LCB5KSB7XG4gICAgICAgICAgICB0aGlzLmN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBcImRlc3RpbmF0aW9uLW92ZXJcIjtcbiAgICAgICAgICAgIHRoaXMuY3R4LmRyYXdJbWFnZShwYXJ0LCB4LCB5KTtcbiAgICAgICAgfTtcbiAgICAgICAgU3VyZmFjZVJlbmRlci5wcm90b3R5cGUucmVwbGFjZSA9IGZ1bmN0aW9uIChwYXJ0LCB4LCB5KSB7XG4gICAgICAgICAgICB0aGlzLmN0eC5jbGVhclJlY3QoeCwgeSwgcGFydC53aWR0aCwgcGFydC5oZWlnaHQpO1xuICAgICAgICAgICAgdGhpcy5vdmVybGF5ZmFzdChwYXJ0LCB4LCB5KTtcbiAgICAgICAgfTtcbiAgICAgICAgU3VyZmFjZVJlbmRlci5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uIChjbnYpIHtcbiAgICAgICAgICAgIHRoaXMuY252LndpZHRoID0gY252LndpZHRoO1xuICAgICAgICAgICAgdGhpcy5jbnYuaGVpZ2h0ID0gY252LmhlaWdodDtcbiAgICAgICAgICAgIHRoaXMub3ZlcmxheWZhc3QoY252LCAwLCAwKTsgLy8gdHlwZSBoYWNrXG4gICAgICAgIH07XG4gICAgICAgIFN1cmZhY2VSZW5kZXIucHJvdG90eXBlLmRyYXdSZWdpb24gPSBmdW5jdGlvbiAocmVnaW9uKSB7XG4gICAgICAgICAgICB2YXIgdHlwZSA9IHJlZ2lvbi50eXBlLCBuYW1lID0gcmVnaW9uLm5hbWUsIGxlZnQgPSByZWdpb24ubGVmdCwgdG9wID0gcmVnaW9uLnRvcCwgcmlnaHQgPSByZWdpb24ucmlnaHQsIGJvdHRvbSA9IHJlZ2lvbi5ib3R0b20sIGNvb3JkaW5hdGVzID0gcmVnaW9uLmNvb3JkaW5hdGVzLCByYWRpdXMgPSByZWdpb24ucmFkaXVzLCBjZW50ZXJfeCA9IHJlZ2lvbi5jZW50ZXJfeCwgY2VudGVyX3kgPSByZWdpb24uY2VudGVyX3k7XG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IFwiIzAwRkYwMFwiO1xuICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcInJlY3RcIjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdHgucmVjdChsZWZ0LCB0b3AsIHJpZ2h0IC0gbGVmdCwgYm90dG9tIC0gdG9wKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcImVsbGlwc2VcIjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdHgucmVjdChsZWZ0LCB0b3AsIHJpZ2h0IC0gbGVmdCwgYm90dG9tIC0gdG9wKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcImNpcmNsZVwiOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN0eC5yZWN0KGxlZnQsIHRvcCwgcmlnaHQgLSBsZWZ0LCBib3R0b20gLSB0b3ApO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwicG9seWdvblwiOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN0eC5yZWN0KGxlZnQsIHRvcCwgcmlnaHQgLSBsZWZ0LCBib3R0b20gLSB0b3ApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XG4gICAgICAgICAgICB0aGlzLmN0eC5mb250ID0gXCIzNXB4XCI7XG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IFwid2hpdGVcIjtcbiAgICAgICAgICAgIHRoaXMuY3R4LnN0cm9rZVRleHQodHlwZSArIFwiOlwiICsgbmFtZSwgbGVmdCArIDUsIHRvcCArIDEwKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IFwiYmxhY2tcIjtcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxUZXh0KHR5cGUgKyBcIjpcIiArIG5hbWUsIGxlZnQgKyA1LCB0b3AgKyAxMCk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBTdXJmYWNlUmVuZGVyO1xuICAgIH0pKCk7XG4gICAgY3V0dGxlYm9uZS5TdXJmYWNlUmVuZGVyID0gU3VyZmFjZVJlbmRlcjtcbn0pKGN1dHRsZWJvbmUgfHwgKGN1dHRsZWJvbmUgPSB7fSkpO1xuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGluZ3MvdHNkLmQudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiU3VyZmFjZVV0aWwudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiU3VyZmFjZVJlbmRlci50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90c2QvU3VyZmFjZXNUeHQyWWFtbC9TdXJmYWNlc1R4dDJZYW1sLmQudHNcIi8+XG52YXIgY3V0dGxlYm9uZTtcbihmdW5jdGlvbiAoY3V0dGxlYm9uZSkge1xuICAgIDtcbiAgICB2YXIgU3VyZmFjZUNhY2hlTWFuYWdlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIFN1cmZhY2VDYWNoZU1hbmFnZXIoc3VyZmFjZXMsIGRpcmVjdG9yeSkge1xuICAgICAgICAgICAgdGhpcy5zdXJmYWNlcyA9IHN1cmZhY2VzO1xuICAgICAgICAgICAgdGhpcy5kaXJlY3RvcnkgPSBkaXJlY3Rvcnk7XG4gICAgICAgICAgICB0aGlzLmJhc2VTdXJmYWNlQ2FjaGVzID0gW107XG4gICAgICAgIH1cbiAgICAgICAgU3VyZmFjZUNhY2hlTWFuYWdlci5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoUHJvbWlzZS5yZXNvbHZlKF90aGlzKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgU3VyZmFjZUNhY2hlTWFuYWdlci5wcm90b3R5cGUuaXNDYWNoZWQgPSBmdW5jdGlvbiAoc3VyZmFjZUlkKSB7XG4gICAgICAgICAgICByZXR1cm4gISF0aGlzLmJhc2VTdXJmYWNlQ2FjaGVzW3N1cmZhY2VJZF07XG4gICAgICAgIH07XG4gICAgICAgIFN1cmZhY2VDYWNoZU1hbmFnZXIucHJvdG90eXBlLmdldFN1cmZhY2VGaWxlbmFtZSA9IGZ1bmN0aW9uIChzdXJmYWNlSWQpIHtcbiAgICAgICAgICAgIHZhciByZWcgPSAvXnN1cmZhY2UoXFxkKylcXC5wbmckL2k7XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5kaXJlY3RvcnkpXG4gICAgICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoZmlsZW5hbWUpIHsgcmV0dXJuIHJlZy50ZXN0KGZpbGVuYW1lKTsgfSlcbiAgICAgICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChmaWxlbmFtZSkgeyByZXR1cm4gc3VyZmFjZUlkID09PSBOdW1iZXIocmVnLmV4ZWMoZmlsZW5hbWUpWzFdKTsgfSlbMF0gfHwgXCJcIjtcbiAgICAgICAgfTtcbiAgICAgICAgU3VyZmFjZUNhY2hlTWFuYWdlci5wcm90b3R5cGUuZ2V0UE5BRmlsZW5hbWUgPSBmdW5jdGlvbiAoZmlsZW5hbWUpIHtcbiAgICAgICAgICAgIHZhciBwbmFmaWxlbmFtZSA9IGZpbGVuYW1lLnJlcGxhY2UoL1xcLnBuZyQvaSwgXCIucG5hXCIpO1xuICAgICAgICAgICAgdmFyIHJlZyA9IG5ldyBSZWdFeHAocG5hZmlsZW5hbWUsIFwiaVwiKTtcbiAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmRpcmVjdG9yeSlcbiAgICAgICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChmaWxlbmFtZSkgeyByZXR1cm4gcmVnLnRlc3QoZmlsZW5hbWUpOyB9KVswXSB8fCBcIlwiO1xuICAgICAgICB9O1xuICAgICAgICBTdXJmYWNlQ2FjaGVNYW5hZ2VyLnByb3RvdHlwZS5nZXRTdXJmYWNlRGVmaW5pdGlvbiA9IGZ1bmN0aW9uIChzdXJmYWNlSWQpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5zdXJmYWNlcylcbiAgICAgICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChrZXkpIHsgcmV0dXJuIF90aGlzLnN1cmZhY2VzW2tleV0uaXMgPT09IHN1cmZhY2VJZDsgfSlbMF07XG4gICAgICAgIH07XG4gICAgICAgIFN1cmZhY2VDYWNoZU1hbmFnZXIucHJvdG90eXBlLmZldGNoU3VyZmFjZUltYWdlID0gZnVuY3Rpb24gKGZpbGVuYW1lKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIHBuYWZpbGVuYW1lID0gdGhpcy5nZXRQTkFGaWxlbmFtZShmaWxlbmFtZSk7XG4gICAgICAgICAgICB2YXIgY252ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcbiAgICAgICAgICAgIGNudi53aWR0aCA9IDA7XG4gICAgICAgICAgICBjbnYuaGVpZ2h0ID0gMDtcbiAgICAgICAgICAgIHZhciByZW5kZXIgPSBuZXcgY3V0dGxlYm9uZS5TdXJmYWNlUmVuZGVyKGNudik7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgIGN1dHRsZWJvbmUuU3VyZmFjZVV0aWwuZmV0Y2hJbWFnZUZyb21BcnJheUJ1ZmZlcihfdGhpcy5kaXJlY3RvcnlbZmlsZW5hbWVdKS50aGVuKGZ1bmN0aW9uIChpbWcpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyLmluaXQoaW1nKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBuYWZpbGVuYW1lLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyLmNocm9tYWtleSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoUHJvbWlzZS5yZXNvbHZlKHJlbmRlcikpOyAvLyB0eXBlIGhhY2tcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjdXR0bGVib25lLlN1cmZhY2VVdGlsLmZldGNoSW1hZ2VGcm9tQXJyYXlCdWZmZXIoX3RoaXMuZGlyZWN0b3J5W3BuYWZpbGVuYW1lXSkudGhlbihmdW5jdGlvbiAocG5hKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW5kZXIucG5hKGN1dHRsZWJvbmUuU3VyZmFjZVV0aWwuY29weShwbmEpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoUHJvbWlzZS5yZXNvbHZlKHJlbmRlcikpOyAvLyB0eXBlIGhhY2tcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgU3VyZmFjZUNhY2hlTWFuYWdlci5wcm90b3R5cGUuZmV0Y2hCYXNlU3VyZmFjZSA9IGZ1bmN0aW9uIChzdXJmYWNlSWQpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0NhY2hlZChzdXJmYWNlSWQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLmJhc2VTdXJmYWNlQ2FjaGVzW3N1cmZhY2VJZF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHN1cmZhY2VEZWYgPSB0aGlzLmdldFN1cmZhY2VEZWZpbml0aW9uKHN1cmZhY2VJZCk7XG4gICAgICAgICAgICB2YXIgYmFzZVN1cmZhY2VGaWxlbmFtZSA9IHRoaXMuZ2V0U3VyZmFjZUZpbGVuYW1lKHN1cmZhY2VJZCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mZXRjaFN1cmZhY2VJbWFnZShiYXNlU3VyZmFjZUZpbGVuYW1lKS50aGVuKGZ1bmN0aW9uIChyZW5kZXIpIHtcbiAgICAgICAgICAgICAgICAvL3JlbmRlci5jb21wb3NlRWxlbWVudHMoKTtcbiAgICAgICAgICAgICAgICBfdGhpcy5iYXNlU3VyZmFjZUNhY2hlc1tzdXJmYWNlSWRdID0gcmVuZGVyLmNudjtcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKF90aGlzLmJhc2VTdXJmYWNlQ2FjaGVzW3N1cmZhY2VJZF0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBTdXJmYWNlQ2FjaGVNYW5hZ2VyO1xuICAgIH0pKCk7XG4gICAgY3V0dGxlYm9uZS5TdXJmYWNlQ2FjaGVNYW5hZ2VyID0gU3VyZmFjZUNhY2hlTWFuYWdlcjtcbn0pKGN1dHRsZWJvbmUgfHwgKGN1dHRsZWJvbmUgPSB7fSkpO1xuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGluZ3MvdHNkLmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3RzZC9OYXJMb2FkZXIvTmFyTG9hZGVyLmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3RzZC9TdXJmYWNlc1R4dDJZYW1sL1N1cmZhY2VzVHh0MllhbWwuZC50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90c2QvZW5jb2RpbmctamFwYW5lc2UvZW5jb2RpbmcuZC50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9zcmMvU3VyZmFjZUNhY2hlTWFuYWdlci50c1wiIC8+XG52YXIgcHJtTmFyID0gTmFyTG9hZGVyLmxvYWRGcm9tVVJMKFwiLi4vbmFyL21vYmlsZW1hc3Rlci5uYXJcIik7XG5wcm1OYXIudGhlbihmdW5jdGlvbiAobmFuaWthRGlyKSB7XG4gICAgUVVuaXQubW9kdWxlKFwiY3V0dGxlYm9uZS5TdXJmYWNlQ2FjaGVNYW5hZ2VyXCIpO1xuICAgIHZhciBzaGVsbERpciA9IG5hbmlrYURpci5nZXREaXJlY3RvcnkoXCJzaGVsbC9tYXN0ZXJcIikuYXNBcnJheUJ1ZmZlcigpO1xuICAgIGNvbnNvbGUubG9nKHNoZWxsRGlyKTtcbiAgICB2YXIgZmlsZW5hbWVzID0gT2JqZWN0LmtleXMoc2hlbGxEaXIpLmZpbHRlcihmdW5jdGlvbiAoZmlsZW5hbWUpIHsgcmV0dXJuIC9zdXJmYWNlc1xcUypcXC50eHQkLy50ZXN0KGZpbGVuYW1lKTsgfSk7XG4gICAgY29uc29sZS5sb2coZmlsZW5hbWVzKTtcbiAgICB2YXIgY2F0ZWQgPSBmaWxlbmFtZXMucmVkdWNlKGZ1bmN0aW9uIChzdHIsIGZpbGVuYW1lKSB7XG4gICAgICAgIHJldHVybiBzdHIgKyBFbmNvZGluZy5jb2RlVG9TdHJpbmcoRW5jb2RpbmcuY29udmVydChuZXcgVWludDhBcnJheShzaGVsbERpcltmaWxlbmFtZV0pLCAnVU5JQ09ERScsICdBVVRPJykpO1xuICAgIH0sIFwiXCIpO1xuICAgIHZhciBzdXJmYWNlcyA9IFN1cmZhY2VzVHh0MllhbWwudHh0X3RvX2RhdGEoY2F0ZWQsIHsgY29tcGF0aWJsZTogJ3NzcC1sYXp5JyB9KTtcbiAgICBjb25zb2xlLmxvZyhzdXJmYWNlcyk7XG4gICAgdmFyIHNyZk1nciA9IG5ldyBjdXR0bGVib25lLlN1cmZhY2VDYWNoZU1hbmFnZXIoc3VyZmFjZXMsIHNoZWxsRGlyKTtcbiAgICBjb25zb2xlLmxvZyhzcmZNZ3IpO1xuICAgIFFVbml0LnRlc3QoXCJTdXJmYWNlQ2FjaGVNYW5hZ2VyI2lzQ2FjaGVkXCIsIGZ1bmN0aW9uIChhc3NlcnQpIHtcbiAgICAgICAgYXNzZXJ0Lm9rKHNyZk1nci5pc0NhY2hlZCgwKSA9PT0gZmFsc2UpO1xuICAgIH0pO1xuICAgIFFVbml0LnRlc3QoXCJTdXJmYWNlQ2FjaGVNYW5hZ2VyI2dldFN1cmZhY2VGaWxlbmFtZVwiLCBmdW5jdGlvbiAoYXNzZXJ0KSB7XG4gICAgICAgIGFzc2VydC5vayhzcmZNZ3IuZ2V0U3VyZmFjZUZpbGVuYW1lKDApID09PSBcInN1cmZhY2UwLnBuZ1wiKTtcbiAgICB9KTtcbiAgICBRVW5pdC50ZXN0KFwiU3VyZmFjZUNhY2hlTWFuYWdlciNnZXRTdXJmYWNlRmlsZW5hbWVcIiwgZnVuY3Rpb24gKGFzc2VydCkge1xuICAgICAgICBhc3NlcnQub2soc3JmTWdyLmdldFN1cmZhY2VGaWxlbmFtZSgwKSA9PT0gXCJzdXJmYWNlMC5wbmdcIik7XG4gICAgfSk7XG4gICAgUVVuaXQudGVzdChcIlN1cmZhY2VDYWNoZU1hbmFnZXIjZ2V0UE5BRmlsZW5hbWVcIiwgZnVuY3Rpb24gKGFzc2VydCkge1xuICAgICAgICBhc3NlcnQub2soc3JmTWdyLmdldFBOQUZpbGVuYW1lKHNyZk1nci5nZXRTdXJmYWNlRmlsZW5hbWUoNzMxKSkgPT09IFwic3VyZmFjZTczMS5wbmFcIik7XG4gICAgfSk7XG4gICAgUVVuaXQudGVzdChcIlN1cmZhY2VDYWNoZU1hbmFnZXIjZ2V0U3VyZmFjZURlZmluaXRpb25cIiwgZnVuY3Rpb24gKGFzc2VydCkge1xuICAgICAgICBhc3NlcnQub2soc3JmTWdyLmdldFN1cmZhY2VEZWZpbml0aW9uKDApLl9pcyA9PT0gMCk7XG4gICAgfSk7XG59KTtcbiJdfQ==

