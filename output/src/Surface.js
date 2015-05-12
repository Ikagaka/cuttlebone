/// <reference path="SurfaceRender.ts"/>
/// <reference path="SurfaceUtil.ts"/>
/// <reference path="Shell.ts"/>
var cuttlebone;
(function (cuttlebone) {
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
            this.bufRender.init(this.surfaceTreeNode.base);
            this.bufRender.composeElements(this.surfaceTreeNode.elements);
            this.elmRender.init(this.bufRender.cnv);
        };
        Surface.prototype.play = function (animationId, callback) {
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
        return Surface;
    })();
    cuttlebone.Surface = Surface;
})(cuttlebone || (cuttlebone = {}));
