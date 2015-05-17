/// <reference path="./SurfaceUtil"/>
/// <reference path="./SurfaceRender"/>
/// <reference path="./BalloonSurface"/>
var cuttlebone;
(function (cuttlebone) {
    var Balloon = (function () {
        function Balloon(directory) {
            this.directory = directory;
            this.descript = {};
            this.blimps = [];
        }
        Balloon.prototype.load = function () {
            return Promise.resolve(this);
        };
        Balloon.prototype.attachBlimp = function (div, scopeId, surfaceId) {
            var blimp = new cuttlebone.BalloonSurface(div, scopeId, surfaceId, this);
            this.blimps.push([div, blimp]);
            return blimp;
        };
        Balloon.prototype.detachBlimp = function (div) {
            var tuple = this.blimps.filter(function (tuple) { return tuple[0] === div; })[0];
            if (!tuple)
                return;
            tuple[1].destructor();
            this.blimps.splice(this.blimps.indexOf(tuple), 1);
        };
        return Balloon;
    })();
    cuttlebone.Balloon = Balloon;
})(cuttlebone || (cuttlebone = {}));
