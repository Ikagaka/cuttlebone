/// <reference path="../typings/tsd.d.ts"/>
var cuttlebone;
(function (cuttlebone) {
    var SurfaceUtil;
    (function (SurfaceUtil) {
        function choice(arr) {
            return arr[Math.round(Math.random() * (arr.length - 1))];
        }
        SurfaceUtil.choice = choice;
        function copy(cnv) {
            var copy = document.createElement("canvas");
            var ctx = copy.getContext("2d");
            copy.width = cnv.width;
            copy.height = cnv.height;
            ctx.drawImage(cnv, 0, 0); // type hack
            return copy;
        }
        SurfaceUtil.copy = copy;
        function fetchImageFromArrayBuffer(buffer, mimetype) {
            var url = URL.createObjectURL(new Blob([buffer], { type: mimetype || "image/png" }));
            return fetchImageFromURL(url).then(function (img) {
                URL.revokeObjectURL(url);
                return Promise.resolve(img);
            });
        }
        SurfaceUtil.fetchImageFromArrayBuffer = fetchImageFromArrayBuffer;
        function fetchImageFromURL(url) {
            var img = new Image;
            img.src = url;
            return new Promise(function (resolve, reject) {
                img.addEventListener("load", function () {
                    resolve(Promise.resolve(img)); // type hack
                });
                img.addEventListener("error", function (ev) {
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
            setTimeout((function () {
                return callback(function () { return random(callback, probability); });
            }), ms * 1000);
        }
        SurfaceUtil.random = random;
        function periodic(callback, sec) {
            setTimeout((function () {
                return callback(function () {
                    return periodic(callback, sec);
                });
            }), sec * 1000);
        }
        SurfaceUtil.periodic = periodic;
        function always(callback) {
            callback(function () { return always(callback); });
        }
        SurfaceUtil.always = always;
        function isHit(cnv, x, y) {
            var ctx = cnv.getContext("2d");
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
            element.style.display = "none";
            // elementを非表示にして直下の要素を調べる
            var elm = document.elementFromPoint(pageX, pageY);
            // 直下の要素がcanvasなら透明かどうか調べる
            // todo: cuttlebone管理下の要素かどうかの判定必要
            if (elm instanceof HTMLCanvasElement) {
                var _a = offset(elm), top = _a.top, left = _a.left;
                // 不透明ならヒット
                if (isHit(elm, pageX - left, pageY - top)) {
                    element.style.display = tmp;
                    return elm;
                }
            }
            // elementの非表示のままさらに下の要素を調べにいく
            if (elm instanceof HTMLElement) {
                var _elm = elementFromPointWithout(elm, pageX, pageY);
                element.style.display = tmp;
                return _elm;
            }
            // 解決できなかった！ザンネン!
            console.warn(elm);
            element.style.display = tmp;
            return null;
        }
        SurfaceUtil.elementFromPointWithout = elementFromPointWithout;
    })(SurfaceUtil = cuttlebone.SurfaceUtil || (cuttlebone.SurfaceUtil = {}));
})(cuttlebone || (cuttlebone = {}));
/// <reference path="../typings/tsd.d.ts"/>
var cuttlebone;
(function (cuttlebone) {
    var SurfaceRender = (function () {
        function SurfaceRender(cnv) {
            this.cnv = cnv;
            this.ctx = cnv.getContext("2d");
        }
        SurfaceRender.prototype.composeElements = function (elements) {
            if (elements.length === 0) {
                return;
            }
            var _a = elements[0], canvas = _a.canvas, type = _a.type, x = _a.x, y = _a.y;
            var offsetX = 0;
            var offsetY = 0;
            switch (type) {
                case "base":
                    this.base(canvas, offsetX, offsetY);
                    break;
                case "overlay":
                    this.overlay(canvas, offsetX + x, offsetY + y);
                    break;
                case "overlayfast":
                    this.overlayfast(canvas, offsetX + x, offsetY + y);
                    break;
                case "replace":
                    this.replace(canvas, offsetX + x, offsetY + y);
                    break;
                case "add":
                    this.overlayfast(canvas, offsetX + x, offsetY + y);
                    break;
                case "bind":
                    this.overlayfast(canvas, offsetX + x, offsetY + y);
                    break;
                case "interpolate":
                    this.interpolate(canvas, offsetX + x, offsetY + y);
                    break;
                case "move":
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
            var ctx = this.cnv.getContext("2d");
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
            var ctxB = pna.getContext("2d");
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
                this.base(part, x, y); // 下のレイヤ消えてpartから描画されるんじゃね？
            }
            else {
                this.overlayfast(part, x, y);
            }
        };
        SurfaceRender.prototype.overlayfast = function (part, x, y) {
            this.ctx.globalCompositeOperation = "source-over";
            this.ctx.drawImage(part, x, y);
        };
        SurfaceRender.prototype.interpolate = function (part, x, y) {
            this.ctx.globalCompositeOperation = "destination-over";
            this.ctx.drawImage(part, x, y);
        };
        SurfaceRender.prototype.replace = function (part, x, y) {
            this.ctx.clearRect(x, y, part.width, part.height);
            this.overlayfast(part, x, y);
        };
        SurfaceRender.prototype.init = function (cnv) {
            this.cnv.width = cnv.width;
            this.cnv.height = cnv.height;
            this.overlayfast(cnv, 0, 0); // type hack
        };
        SurfaceRender.prototype.drawRegion = function (region) {
            var type = region.type, name = region.name, left = region.left, top = region.top, right = region.right, bottom = region.bottom, coordinates = region.coordinates, radius = region.radius, center_x = region.center_x, center_y = region.center_y;
            this.ctx.strokeStyle = "#00FF00";
            switch (type) {
                case "rect":
                    this.ctx.rect(left, top, right - left, bottom - top);
                    break;
                case "ellipse":
                    this.ctx.rect(left, top, right - left, bottom - top);
                    break;
                case "circle":
                    this.ctx.rect(left, top, right - left, bottom - top);
                    break;
                case "polygon":
                    this.ctx.rect(left, top, right - left, bottom - top);
            }
            this.ctx.stroke();
            this.ctx.font = "35px";
            this.ctx.strokeStyle = "white";
            this.ctx.strokeText(type + ":" + name, left + 5, top + 10);
            this.ctx.fillStyle = "black";
            this.ctx.fillText(type + ":" + name, left + 5, top + 10);
        };
        return SurfaceRender;
    })();
    cuttlebone.SurfaceRender = SurfaceRender;
})(cuttlebone || (cuttlebone = {}));
/// <reference path="../typings/tsd.d.ts"/>
/// <reference path="SurfaceUtil.ts"/>
/// <reference path="SurfaceRender.ts"/>
/// <reference path="../tsd/SurfacesTxt2Yaml/SurfacesTxt2Yaml.d.ts"/>
var cuttlebone;
(function (cuttlebone) {
    ;
    var SurfaceCacheManager = (function () {
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
            return Object.keys(this.directory)
                .filter(function (filename) { return reg.test(filename); })
                .filter(function (filename) { return surfaceId === Number(reg.exec(filename)[1]); })[0] || "";
        };
        SurfaceCacheManager.prototype.getPNAFilename = function (filename) {
            var pnafilename = filename.replace(/\.png$/i, ".pna");
            var reg = new RegExp(pnafilename, "i");
            return Object.keys(this.directory)
                .filter(function (filename) { return reg.test(filename); })[0] || "";
        };
        SurfaceCacheManager.prototype.getSurfaceDefinition = function (surfaceId) {
            var _this = this;
            return Object.keys(this.surfaces)
                .filter(function (key) { return _this.surfaces[key].is === surfaceId; })[0];
        };
        SurfaceCacheManager.prototype.fetchSurfaceImage = function (filename) {
            var _this = this;
            var pnafilename = this.getPNAFilename(filename);
            var cnv = document.createElement("canvas");
            cnv.width = 0;
            cnv.height = 0;
            var render = new cuttlebone.SurfaceRender(cnv);
            return new Promise(function (resolve, reject) {
                cuttlebone.SurfaceUtil.fetchImageFromArrayBuffer(_this.directory[filename]).then(function (img) {
                    render.init(img);
                    if (pnafilename.length === 0) {
                        render.chromakey();
                        return resolve(Promise.resolve(render)); // type hack
                    }
                    cuttlebone.SurfaceUtil.fetchImageFromArrayBuffer(_this.directory[pnafilename]).then(function (pna) {
                        render.pna(cuttlebone.SurfaceUtil.copy(pna));
                        resolve(Promise.resolve(render)); // type hack
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
                //render.composeElements();
                _this.baseSurfaceCaches[surfaceId] = render.cnv;
                return Promise.resolve(_this.baseSurfaceCaches[surfaceId]);
            });
        };
        return SurfaceCacheManager;
    })();
    cuttlebone.SurfaceCacheManager = SurfaceCacheManager;
})(cuttlebone || (cuttlebone = {}));
/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../tsd/NarLoader/NarLoader.d.ts" />
/// <reference path="../tsd/SurfacesTxt2Yaml/SurfacesTxt2Yaml.d.ts"/>
/// <reference path="../tsd/encoding-japanese/encoding.d.ts"/>
/// <reference path="../src/SurfaceCacheManager.ts" />
var prmNar = NarLoader.loadFromURL("../nar/mobilemaster.nar");
prmNar.then(function (nanikaDir) {
    QUnit.module("cuttlebone.SurfaceCacheManager");
    var shellDir = nanikaDir.getDirectory("shell/master").asArrayBuffer();
    console.log(shellDir);
    var filenames = Object.keys(shellDir).filter(function (filename) { return /surfaces\S*\.txt$/.test(filename); });
    console.log(filenames);
    var cated = filenames.reduce(function (str, filename) {
        return str + Encoding.codeToString(Encoding.convert(new Uint8Array(shellDir[filename]), 'UNICODE', 'AUTO'));
    }, "");
    var surfaces = SurfacesTxt2Yaml.txt_to_data(cated, { compatible: 'ssp-lazy' });
    console.log(surfaces);
    var srfMgr = new cuttlebone.SurfaceCacheManager(surfaces, shellDir);
    console.log(srfMgr);
    QUnit.test("SurfaceCacheManager#isCached", function (assert) {
        assert.ok(srfMgr.isCached(0) === false);
    });
    QUnit.test("SurfaceCacheManager#getSurfaceFilename", function (assert) {
        assert.ok(srfMgr.getSurfaceFilename(0) === "surface0.png");
    });
    QUnit.test("SurfaceCacheManager#getSurfaceFilename", function (assert) {
        assert.ok(srfMgr.getSurfaceFilename(0) === "surface0.png");
    });
    QUnit.test("SurfaceCacheManager#getPNAFilename", function (assert) {
        assert.ok(srfMgr.getPNAFilename(srfMgr.getSurfaceFilename(731)) === "surface731.pna");
    });
    QUnit.test("SurfaceCacheManager#getSurfaceDefinition", function (assert) {
        assert.ok(srfMgr.getSurfaceDefinition(0)._is === 0);
    });
});
