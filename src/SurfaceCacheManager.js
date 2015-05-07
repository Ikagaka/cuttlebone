/// <reference path="../typings/tsd.d.ts"/>
/// <reference path="SurfaceUtil.ts"/>
/// <reference path="SurfaceRender.ts"/>
/// <reference path="../tsd/SurfacesTxt2Yaml/SurfacesTxt2Yaml.d.ts"/>
var cuttlebone;
(function (cuttlebone) {
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
            var hits = Object.keys(this.surfaces).filter(function (key) { return _this.surfaces.surfaces[key].is === surfaceId; });
            return this.surfaces.surfaces[hits[0]];
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
    })();
    cuttlebone.SurfaceCacheManager = SurfaceCacheManager;
})(cuttlebone || (cuttlebone = {}));
