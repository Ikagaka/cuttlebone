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
            this.overlayfast(cnv, 0, 0);
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
/// <reference path="../typings/bluebird/bluebird.d.ts" />
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
        function fetchImage(url) {
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
        SurfaceUtil.fetchImage = fetchImage;
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
/// <reference path="SurfaceRender.ts"/>
/// <reference path="SurfaceUtil.ts"/>
var cuttlebone;
(function (cuttlebone) {
    var Surface = (function () {
        function Surface(canvas, scopeId, surfaceId, surfaceName, surfaces) {
            var _this = this;
            this.element = canvas;
            this.scopeId = scopeId;
            this.surfaceId = surfaceId;
            this.surfaceName = surfaceName;
            this.surfaces = surfaces;
            var srf = this.surfaces[surfaceName];
            if (!srf)
                throw new Error(surfaceName + " is not found in surfaces");
            if (!srf.baseSurface)
                console.warn("baseSurface is not found", this);
            this.baseSurface = srf.baseSurface;
            this.regions = srf.regions || {};
            this.animations = srf.animations || {};
            this.bufferCanvas = cuttlebone.SurfaceUtil.copy(this.baseSurface);
            this.stopFlags = {};
            this.layers = {};
            this.destructed = false;
            this.talkCount = 0;
            this.talkCounts = {};
            this.isPointerEventsShimed = false;
            this.isRegionVisible = false;
            this.lastEventType = "";
            this.element.addEventListener("contextmenu", function (ev) { return _this.processMouseEvent(ev, "mouseclick", function (ev) { return _this.element.dispatchEvent(ev); }); });
            this.element.addEventListener("click", function (ev) { return _this.processMouseEvent(ev, "mouseclick", function (ev) { return _this.element.dispatchEvent(ev); }); });
            this.element.addEventListener("dblclick", function (ev) { return _this.processMouseEvent(ev, "mousedblclick", function (ev) { return _this.element.dispatchEvent(ev); }); });
            this.element.addEventListener("mousedown", function (ev) { return _this.processMouseEvent(ev, "mousedown", function (ev) { return _this.element.dispatchEvent(ev); }); });
            this.element.addEventListener("mousemove", function (ev) { return _this.processMouseEvent(ev, "mousemove", function (ev) { return _this.element.dispatchEvent(ev); }); });
            this.element.addEventListener("mouseup", function (ev) { return _this.processMouseEvent(ev, "mouseup", function (ev) { return _this.element.dispatchEvent(ev); }); });
            var tid = 0;
            var touchCount = 0;
            var touchStartTime = 0;
            this.element.addEventListener("touchmove", function (ev) { return _this.processMouseEvent(ev, "mousemove", function (ev) { return _this.element.dispatchEvent(ev); }); });
            this.element.addEventListener("touchend", function (ev) {
                _this.processMouseEvent(ev, "mouseup", function (ev) { return _this.element.dispatchEvent(ev); });
                _this.processMouseEvent(ev, "mouseclick", function (ev) { return _this.element.dispatchEvent(ev); });
                if (Date.now() - touchStartTime < 500 && touchCount % 2 === 0) {
                    _this.processMouseEvent(ev, "mousedblclick", function (ev) { return _this.element.dispatchEvent(ev); });
                }
            });
            this.element.addEventListener("touchstart", function (ev) {
                touchCount++;
                touchStartTime = Date.now();
                _this.processMouseEvent(ev, "mousedown", function (ev) { return _this.element.dispatchEvent(ev); });
                clearTimeout(tid);
                tid = setTimeout((function () { return touchCount = 0; }), 500);
            });
            Object.keys(this.animations).forEach(function (name) {
                var _a = _this.animations[name], animationId = _a.is, interval = _a.interval, patterns = _a.patterns;
                interval = interval || "";
                var tmp = interval.split(",");
                interval = tmp[0];
                var n = Number(tmp.slice(1).join(","));
                switch (interval) {
                    case "sometimes":
                        cuttlebone.SurfaceUtil.random((function (callback) { if (!_this.destructed && !_this.stopFlags[animationId]) {
                            _this.play(animationId, callback);
                        } }), 2);
                        break;
                    case "rarely":
                        cuttlebone.SurfaceUtil.random((function (callback) { if (!_this.destructed && !_this.stopFlags[animationId]) {
                            _this.play(animationId, callback);
                        } }), 4);
                        break;
                    case "random":
                        cuttlebone.SurfaceUtil.random((function (callback) { if (!_this.destructed && !_this.stopFlags[animationId]) {
                            _this.play(animationId, callback);
                        } }), n);
                        break;
                    case "periodic":
                        cuttlebone.SurfaceUtil.periodic((function (callback) { if (!_this.destructed && !_this.stopFlags[animationId]) {
                            _this.play(animationId, callback);
                        } }), n);
                        break;
                    case "always":
                        cuttlebone.SurfaceUtil.always((function (callback) { if (!_this.destructed && !_this.stopFlags[animationId]) {
                            _this.play(animationId, callback);
                        } }));
                        break;
                    case "runonce":
                        _this.play(animationId);
                        break;
                    case "never": break;
                    case "bind": break;
                    case "yen-e": break;
                    case "talk":
                        _this.talkCounts[name] = n;
                        break;
                    default:
                        if (/^bind(?:\+(\d+))/.test(interval)) {
                        }
                        else {
                            console.warn(_this.animations[name]);
                        }
                }
            });
            this.render();
        }
        Surface.prototype.destructor = function () {
            var srfRdr = new cuttlebone.SurfaceRender(this.element);
            srfRdr.clear();
            //$(@element).off() # g.c.
            this.destructed = true;
            this.layers = {};
        };
        Surface.prototype.render = function () { };
        Surface.prototype.talk = function () { };
        Surface.prototype.yenE = function () { };
        Surface.prototype.play = function (animationId, callback) { };
        Surface.prototype.stop = function (animationId) {
            this.stopFlags[animationId] = true;
        };
        Surface.prototype.bind = function (animationId) {
            var _this = this;
            var hit = Object.keys(this.animations).filter(function (name) { return _this.animations[name].is === animationId; })[0];
            if (!hit)
                return;
            var anim = this.animations[hit];
            if (anim.patterns.length === 0)
                return;
            var interval = anim.interval;
            var pattern = anim.patterns[anim.patterns.length - 1];
            this.layers[anim.is] = pattern;
            this.render();
            if (/^bind(?:\+(\d+))/.test(interval)) {
                var animIds = interval.split("+").slice(1);
                animIds.forEach(function (animId) { return _this.play(Number(animId)); });
            }
        };
        Surface.prototype.unbind = function (animationId) {
            delete this.layers[animationId];
        };
        Surface.prototype.processMouseEvent = function (ev, eventName, callback) {
        };
        return Surface;
    })();
    cuttlebone.Surface = Surface;
})(cuttlebone || (cuttlebone = {}));
/// <reference path="Util.ts"/>
/// <reference path="Surface.ts"/>
/// <referenec path="../tsd/SurfacesTxt2Yaml/SurfacesTxt2Yaml.d.ts">
var cuttlebone;
(function (cuttlebone) {
    var Shell = (function () {
        function Shell(directory) {
            this.directory = directory;
            this.descript = {};
            this.surfaces = { surfaces: {} };
        }
        Shell.prototype.load = function () {
            var _this = this;
            if (!!this.directory["descript.txt"]) {
                this.descript = Util.parseDescript(Util.convert(this.directory["descript.txt"]));
            }
            else {
                console.warn("descript.txt is not found");
            }
            var hits = Object.keys(this.directory).filter(function (name) { return /surfaces\d*\.txt$/.test(name); });
            if (hits.length === 0) {
                console.warn("surfaces.txt is not found");
            }
            else {
                var surfaces = hits.reduce((function (obj, name) {
                    var _srfs = Util.parseSurfaces(Util.convert(_this.directory[name]));
                    return $.extend(true, obj, _srfs);
                }), {});
            }
            var prm = Promise.resolve(surfaces);
            prm
                .then(this.mergeSurfacesAndSurfacesFiles())
                .then(this.loadSurfaces())
                .then(this.loadElements())
                .then(this.createBases())
                .then(function (surfaces) {
                _this.surfaces = surfaces;
                _this.directory = null;
                return _this;
            })
                .catch(function (err) {
                console.error(err);
                err.message && console.error(err.message);
                err.stack && console.error(err.stack);
                throw err;
            });
            return prm;
        };
        Shell.prototype.attachSurface = function (canvas, scopeId, surfaceId) {
        };
        Shell.prototype.mergeSurfacesAndSurfacesFiles = function () { };
        Shell.prototype.loadSurfaces = function () { };
        Shell.prototype.loadElements = function () { };
        Shell.prototype.createBases = function () { };
        return Shell;
    })();
    cuttlebone.Shell = Shell;
})(cuttlebone || (cuttlebone = {}));
