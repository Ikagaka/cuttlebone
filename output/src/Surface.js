/// <reference path="SurfaceRender.ts"/>
/// <reference path="SurfaceUtil.ts"/>
/// <reference path="Shell.ts"/>
var cuttlebone;
(function (cuttlebone) {
    function randomRange(min, max) {
        return min + Math.floor(Math.random() * (max - min + 1));
    }
    var Surface = (function () {
        function Surface(canvas, scopeId, surfaceId, shell) {
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
            this.isRegionVisible = false;
            this.initAnimation();
            this.render();
        }
        Surface.prototype.initAnimation = function () {
            var _this = this;
            this.surfaceTreeNode.animations.forEach(function (arg) {
                var is = arg.is, interval = arg.interval, patterns = arg.patterns;
                interval = interval || "";
                var tmp = interval.split(",");
                interval = tmp[0];
                var n = Number(tmp.slice(1).join(","));
                switch (interval) {
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
                        _this.play(is);
                        break;
                    case "never": break;
                    case "bind": break;
                    case "yen-e": break;
                    case "talk":
                        _this.talkCounts[is] = n;
                        break;
                    default:
                        if (/^bind(?:\+(\d+))/.test(interval)) {
                        }
                        else {
                            console.warn(_this.surfaceTreeNode.animations[is]);
                        }
                }
            });
        };
        Surface.prototype.destructor = function () {
            this.elmRender.clear();
            this.destructed = true;
            this.layers = {};
        };
        Surface.prototype.render = function () {
            var _this = this;
            var sorted = Object.keys(this.layers).sort(function (layerNumA, layerNumB) { return Number(layerNumA) > Number(layerNumB) ? 1 : -1; });
            var mapped = sorted.map(function (key) { return _this.layers[Number(key)]; });
            var patterns = mapped.reduce((function (arr, pat) {
                var surface = pat.surface, type = pat.type, x = pat.x, y = pat.y;
                if (surface === -1)
                    return arr;
                var srf = _this.shell.surfaceTree[surface];
                if (!srf)
                    return arr;
                var rndr = new cuttlebone.SurfaceRender(_this.shell.surfaceTree[surface].base);
                rndr.composeElements(_this.shell.surfaceTree[surface].elements);
                // TODO: 呼び出し先の着せ替え有効
                return arr.concat({
                    type: type,
                    x: x,
                    y: y,
                    canvas: rndr.cnv
                });
            }), []);
            this.bufRender.init(this.surfaceTreeNode.base);
            this.bufRender.composeElements(this.surfaceTreeNode.elements);
            this.bufRender.composeElements(patterns);
            this.elmRender.init(this.bufRender.cnv);
            if (this.isRegionVisible) {
                this.elmRender.ctx.fillText("" + this.surfaceId, 5, 10);
                this.surfaceTreeNode.collisions.forEach(function (col) {
                    var name = col.name;
                    _this.elmRender.drawRegion(col);
                });
            }
        };
        Surface.prototype.play = function (animationId, callback) {
            var _this = this;
            var anim = this.surfaceTreeNode.animations[animationId];
            if (!anim)
                return void setTimeout(callback);
            var lazyPromises = anim.patterns.map(function (pattern) { return function () { return new Promise(function (resolve, reject) {
                var surface = pattern.surface, wait = pattern.wait, type = pattern.type, x = pattern.x, y = pattern.y, animation_ids = pattern.animation_ids;
                if (/^start/.test(type)) {
                    var _animId = cuttlebone.SurfaceUtil.choice(animation_ids);
                    if (!!_this.surfaceTreeNode.animations[_animId]) {
                        _this.play(_animId, function () { return resolve(Promise.resolve()); });
                        return;
                    }
                }
                if (/^stop\s*\,\s*\d+/.test(type)) {
                    var _animId = cuttlebone.SurfaceUtil.choice(animation_ids);
                    if (!!_this.surfaceTreeNode.animations[_animId]) {
                        _this.play(_animId, function () { return resolve(Promise.resolve()); });
                        return;
                    }
                }
                if (/^alternativestart/.test(type)) {
                    var _animId = cuttlebone.SurfaceUtil.choice(animation_ids);
                    if (!!_this.surfaceTreeNode.animations[_animId]) {
                        _this.play(_animId, function () { return resolve(Promise.resolve()); });
                        return;
                    }
                }
                if (/^alternativestop/.test(type)) {
                    var _animId = cuttlebone.SurfaceUtil.choice(animation_ids);
                    if (!!_this.surfaceTreeNode.animations[_animId]) {
                        _this.play(_animId, function () { return resolve(Promise.resolve()); });
                        return;
                    }
                }
                _this.layers[animationId] = pattern;
                _this.render();
                // ex. 100-200 ms wait
                var _a = (/(\d+)(?:\-(\d+))?/.exec(wait) || ["", "0"]), __ = _a[0], a = _a[1], b = _a[2];
                if (!!b) {
                    var _wait = randomRange(Number(a), Number(b));
                }
                else {
                    var _wait = Number(wait);
                }
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
        Surface.prototype.bind = function (animationId) {
            var _this = this;
            var animations = this.surfaceTreeNode.animations;
            var anim = animations.filter(function (_anim) { return _anim.is === animationId; })[0];
            if (!anim)
                return;
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
