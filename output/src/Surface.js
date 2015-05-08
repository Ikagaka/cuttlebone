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
