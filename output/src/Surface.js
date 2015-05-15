/// <reference path="SurfaceRender.ts"/>
/// <reference path="SurfaceUtil.ts"/>
/// <reference path="Shell.ts"/>
var cuttlebone;
(function (cuttlebone) {
    function randomRange(min, max) {
        return min + Math.floor(Math.random() * (max - min + 1));
    }
    var Surface = (function () {
        function Surface(canvas, scopeId, surfaceId, shell, options) {
            if (typeof options === "undefined")
                options = {};
            this.element = canvas;
            this.scopeId = scopeId;
            this.surfaceId = surfaceId;
            this.shell = shell;
            this.surfaceTreeNode = shell.surfaceTree[surfaceId];
            this.bufferCanvas = cuttlebone.SurfaceUtil.createCanvas();
            this.bufRender = new cuttlebone.SurfaceRender(this.bufferCanvas);
            this.elmRender = new cuttlebone.SurfaceRender(this.element);
            this.destructed = false;
            this.layers = {};
            this.stopFlags = {};
            this.talkCount = 0;
            this.talkCounts = {};
            this.initAnimations();
            this.render();
        }
        Surface.prototype.initAnimations = function () {
            var _this = this;
            this.surfaceTreeNode.animations.forEach(function (anim) {
                _this.initAnimation(anim);
            });
        };
        Surface.prototype.initAnimation = function (anim) {
            var _this = this;
            var is = anim.is, interval = anim.interval, patterns = anim.patterns;
            var tmp = interval.split(",");
            var _interval = tmp[0];
            if (tmp.length > 1) {
                var n = Number(tmp[1]);
                if (!isFinite(n)) {
                    console.warn("initAnimation > TypeError: surface", this.surfaceId, "animation", anim.is, "interval", interval, " argument is not finite number");
                    n = 4;
                }
            }
            switch (_interval) {
                case "sometimes":
                    cuttlebone.SurfaceUtil.random((function (callback) { if (!_this.destructed && !_this.stopFlags[is]) {
                        _this.play(is, callback);
                    } }), 2);
                    break;
                case "rarely":
                    cuttlebone.SurfaceUtil.random((function (callback) { if (!_this.destructed && !_this.stopFlags[is]) {
                        _this.play(is, callback);
                    } }), 4);
                    break;
                case "random":
                    cuttlebone.SurfaceUtil.random((function (callback) { if (!_this.destructed && !_this.stopFlags[is]) {
                        _this.play(is, callback);
                    } }), n);
                    break;
                case "periodic":
                    cuttlebone.SurfaceUtil.periodic((function (callback) { if (!_this.destructed && !_this.stopFlags[is]) {
                        _this.play(is, callback);
                    } }), n);
                    break;
                case "always":
                    cuttlebone.SurfaceUtil.always((function (callback) { if (!_this.destructed && !_this.stopFlags[is]) {
                        _this.play(is, callback);
                    } }));
                    break;
                case "runonce":
                    this.play(is);
                    break;
                case "never": break;
                case "yen-e": break;
                case "talk":
                    this.talkCounts[is] = n;
                    break;
                default:
                    if (/^bind/.test(interval)) {
                        this.initBind(anim);
                        break;
                    }
                    console.warn("Surface#initAnimation > unkown SERIKO or MAYURA interval:", interval, anim);
            }
        };
        Surface.prototype.updateBind = function () {
            var _this = this;
            this.surfaceTreeNode.animations.forEach(function (anim) {
                var is = anim.is, interval = anim.interval, patterns = anim.patterns;
                if (/^bind/.test(interval)) {
                    _this.initBind(anim);
                }
            });
        };
        Surface.prototype.initBind = function (anim) {
            var _this = this;
            var is = anim.is, interval = anim.interval, patterns = anim.patterns, option = anim.option;
            if (!this.shell.bindgroup[is]) {
                delete this.layers[is];
                this.stop(is);
                return;
            }
            var _a = interval.split("+"), _bind = _a[0], intervals = _a.slice(1);
            intervals.forEach(function (itvl) {
                _this.initAnimation({ interval: itvl, is: is, patterns: patterns, option: option });
            });
            if (intervals.length > 0)
                return;
            this.layers[is] = patterns[patterns.length - 1];
            this.render();
        };
        Surface.prototype.destructor = function () {
            this.elmRender.clear();
            this.destructed = true;
            this.layers = {};
        };
        Surface.prototype.render = function () {
            var _this = this;
            var renderLayers = Object.keys(this.layers)
                .sort(function (layerNumA, layerNumB) { return Number(layerNumA) > Number(layerNumB) ? 1 : -1; })
                .map(function (key) { return _this.layers[Number(key)]; })
                .reduce((function (arr, pat) {
                var surface = pat.surface, type = pat.type, x = pat.x, y = pat.y;
                if (surface === -1)
                    return arr;
                var srf = _this.shell.surfaceTree[surface];
                if (!srf)
                    return arr;
                var rndr = new cuttlebone.SurfaceRender(cuttlebone.SurfaceUtil.copy(srf.base));
                rndr.composeElements(srf.elements);
                //rndr.composeBinds(srf.binds, this.shell);
                return arr.concat({
                    type: type,
                    x: x,
                    y: y,
                    canvas: rndr.cnv
                });
            }), []);
            var srfNode = this.surfaceTreeNode;
            this.bufRender.init(srfNode.base);
            this.bufRender.composeElements(srfNode.elements);
            //this.bufRender.composeBinds(srfNode.binds, this.shell.bindgroup);
            this.bufRender.composeElements(renderLayers);
            if (this.shell.isRegionVisible) {
                this.bufRender.ctx.fillText("" + this.surfaceId, 5, 10);
                this.bufRender.drawRegions(srfNode.collisions);
            }
            this.elmRender.init(this.bufRender.cnv);
        };
        Surface.prototype.play = function (animationId, callback) {
            var _this = this;
            var anims = this.surfaceTreeNode.animations;
            var anim = this.surfaceTreeNode.animations[animationId];
            if (!anim)
                return void setTimeout(callback);
            // lazyPromises: [()=> Promise<void>, ()=> Promise<void>, ...]
            var lazyPromises = anim.patterns.map(function (pattern) { return function () { return new Promise(function (resolve, reject) {
                var surface = pattern.surface, wait = pattern.wait, type = pattern.type, x = pattern.x, y = pattern.y, animation_ids = pattern.animation_ids;
                switch (type) {
                    case "start":
                        _this.play(animation_ids[0], function () { return resolve(Promise.resolve()); });
                        return;
                    case "stop":
                        _this.stop(animation_ids[0]);
                        setTimeout(function () { return resolve(Promise.resolve()); });
                        return;
                    case "alternativestart":
                        _this.play(cuttlebone.SurfaceUtil.choice(animation_ids), function () { return resolve(Promise.resolve()); });
                        return;
                    case "alternativestart":
                        _this.stop(cuttlebone.SurfaceUtil.choice(animation_ids));
                        setTimeout(function () { return resolve(Promise.resolve()); });
                        return;
                }
                _this.layers[animationId] = pattern;
                _this.render();
                var _a = (/(\d+)(?:\-(\d+))?/.exec(wait) || ["", "0"]), __ = _a[0], a = _a[1], b = _a[2];
                var _wait = isFinite(Number(b))
                    ? randomRange(Number(a), Number(b))
                    : Number(a);
                setTimeout((function () {
                    if (_this.destructed) {
                        reject(null);
                    }
                    else {
                        resolve(Promise.resolve());
                    }
                }), _wait);
            }); }; });
            var promise = lazyPromises.reduce((function (proA, proB) { return proA.then(proB); }), Promise.resolve()); // Promise.resolve().then(prom).then(prom)...
            promise
                .then(function () { return setTimeout(callback); })
                .catch(function (err) { if (!!err)
                console.error(err.stack); });
        };
        Surface.prototype.stop = function (animationId) {
            this.stopFlags[animationId] = true;
        };
        Surface.prototype.talk = function () {
            var _this = this;
            var animations = this.surfaceTreeNode.animations;
            this.talkCount++;
            var hits = animations.filter(function (anim) {
                return /^talk/.test(anim.interval) && _this.talkCount % _this.talkCounts[anim.is] === 0;
            });
            hits.forEach(function (anim) {
                _this.play(anim.is);
            });
        };
        Surface.prototype.yenE = function () {
            var _this = this;
            var animations = this.surfaceTreeNode.animations;
            var hits = animations.filter(function (anim) {
                return anim.interval === "yen-e" && _this.talkCount % _this.talkCounts[anim.is] === 0;
            });
            hits.forEach(function (anim) {
                _this.play(anim.is);
            });
        };
        Surface.prototype.getRegion = function (offsetX, offsetY) {
            var _this = this;
            if (cuttlebone.SurfaceUtil.isHit(this.element, offsetX, offsetY)) {
                var hitCol = this.surfaceTreeNode.collisions.filter(function (collision, colId) {
                    var type = collision.type, name = collision.name, left = collision.left, top = collision.top, right = collision.right, bottom = collision.bottom, coordinates = collision.coordinates, radius = collision.radius, center_x = collision.center_x, center_y = collision.center_y;
                    switch (type) {
                        case "rect":
                            return (left < offsetX && offsetX < right && top < offsetY && offsetY < bottom) ||
                                (right < offsetX && offsetX < left && bottom < offsetX && offsetX < top);
                        case "ellipse":
                            var width = Math.abs(right - left);
                            var height = Math.abs(bottom - top);
                            return Math.pow((offsetX - (left + width / 2)) / (width / 2), 2) +
                                Math.pow((offsetY - (top + height / 2)) / (height / 2), 2) < 1;
                        case "circle":
                            return Math.pow((offsetX - center_x) / radius, 2) + Math.pow((offsetY - center_y) / radius, 2) < 1;
                        case "polygon":
                            var ptC = { x: offsetX, y: offsetY };
                            var tuples = coordinates.reduce((function (arr, _a, i) {
                                var x = _a.x, y = _a.y;
                                arr.push([
                                    coordinates[i],
                                    (!!coordinates[i + 1] ? coordinates[i + 1] : coordinates[0])
                                ]);
                                return arr;
                            }), []);
                            var deg = tuples.reduce((function (sum, _a) {
                                var ptA = _a[0], ptB = _a[1];
                                var vctA = [ptA.x - ptC.x, ptA.y - ptC.y];
                                var vctB = [ptB.x - ptC.x, ptB.y - ptC.y];
                                var dotP = vctA[0] * vctB[0] + vctA[1] * vctB[1];
                                var absA = Math.sqrt(vctA.map(function (a) { return Math.pow(a, 2); }).reduce(function (a, b) { return a + b; }));
                                var absB = Math.sqrt(vctB.map(function (a) { return Math.pow(a, 2); }).reduce(function (a, b) { return a + b; }));
                                var rad = Math.acos(dotP / (absA * absB));
                                return sum + rad;
                            }), 0);
                            return deg / (2 * Math.PI) >= 1;
                        default:
                            console.warn("unkown collision type:", _this.surfaceId, colId, name, collision);
                            return null;
                    }
                })[0];
                return hitCol;
            }
            else {
                return null;
            }
        };
        return Surface;
    })();
    cuttlebone.Surface = Surface;
})(cuttlebone || (cuttlebone = {}));
