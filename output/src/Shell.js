/// <reference path="Surface.ts"/>
/// <reference path="SurfaceUtil.ts"/>
/// <reference path="SurfaceRender.ts"/>
/// <reference path="../tsd/SurfacesTxt2Yaml/SurfacesTxt2Yaml.d.ts"/>
/// <reference path="../tsd/encoding-japanese/encoding.d.ts"/>
var cuttlebone;
(function (cuttlebone) {
    function extend(target, source) {
        for (var key in source) {
            if (typeof source[key] === "object" && Object.getPrototypeOf(source[key]) === Object.prototype) {
                target[key] = target[key] || {};
                extend(target[key], source[key]);
            }
            else if (Array.isArray(source[key])) {
                target[key] = target[key] || [];
                extend(target[key], source[key]);
            }
            else if (source[key] !== undefined) {
                target[key] = source[key];
            }
        }
    }
    function parseDescript(text) {
        text = text.replace(/(?:\r\n|\r|\n)/g, "\n"); // CRLF->LF
        while (true) {
            var match = (/(?:(?:^|\s)\/\/.*)|^\s+?$/g.exec(text) || ["", ""])[0];
            if (match.length === 0)
                break;
            text = text.replace(match, "");
        }
        var lines = text.split("\n");
        lines = lines.filter(function (line) { return line.length !== 0; }); // remove no content line
        var dic = lines.reduce(function (dic, line) {
            var tmp = line.split(",");
            var key = tmp[0];
            var vals = tmp.slice(1);
            key = key.trim();
            var val = vals.join(",").trim();
            dic[key] = val;
            return dic;
        }, {});
        return dic;
    }
    function convert(buffer) {
        return Encoding.codeToString(Encoding.convert(new Uint8Array(buffer), 'UNICODE', 'AUTO'));
    }
    function find(paths, filename) {
        filename = filename.split("\\").join("/");
        if (filename.slice(0, 2) === "./")
            filename = filename.slice(2);
        var reg = new RegExp("^" + filename.replace(".", "\.") + "$", "i");
        var hits = paths.filter(function (key) { return reg.test(key); });
        return hits;
    }
    var Shell = (function () {
        function Shell(directory) {
            this.directory = directory;
            this.descript = {};
            this.surfaces = {};
            this.surfaceTree = {};
            this.canvasCache = {};
        }
        Shell.prototype.load = function () {
            var _this = this;
            var prm = Promise.resolve(this)
                .then(function () { return _this.loadDescript(); })
                .then(function () { return _this.loadSurfacesTxt(); })
                .then(function () { return _this.loadSurfaceTable(); })
                .then(function () { return _this.loadSurfacePNG(); })
                .then(function () { return _this.loadCollisions(); })
                .then(function () { return _this.loadAnimations(); })
                .then(function () { return _this.loadElements(); });
            return prm;
        };
        // load descript
        Shell.prototype.loadDescript = function () {
            var descript_name = Object.keys(this.directory).filter(function (name) { return /^descript\.txt$/i.test(name); })[0] || "";
            if (descript_name) {
                this.descript = parseDescript(convert(this.directory[descript_name]));
            }
            else {
                console.warn("descript.txt is not found");
            }
            return Promise.resolve(this);
        };
        // load surfaces.txt
        // TODO: alias.txt
        Shell.prototype.loadSurfacesTxt = function () {
            var _this = this;
            var surfaces_text_names = Object.keys(this.directory).filter(function (name) { return /surfaces.*\.txt$/i.test(name); });
            if (surfaces_text_names.length === 0) {
                console.warn("surfaces.txt is not found");
            }
            else {
                surfaces_text_names.forEach(function (filename) {
                    var _srfs = SurfacesTxt2Yaml.txt_to_data(convert(_this.directory[filename]), { compatible: 'ssp-lazy' });
                    extend(_this.surfaces, _srfs);
                });
            }
            return Promise.resolve(this);
        };
        // load surfacetable.txt
        Shell.prototype.loadSurfaceTable = function () {
            // TODO
            return Promise.resolve(this);
        };
        // load surface*.png surface*.pna
        Shell.prototype.loadSurfacePNG = function () {
            var _this = this;
            var surface_names = Object.keys(this.directory).filter(function (filename) { return /^surface(\d+)\.png$/i.test(filename); });
            var prms = surface_names.map(function (filename) {
                var n = Number(/^surface(\d+)\.png$/i.exec(filename)[1]);
                _this.getPNGFromDirectory(filename).then(function (cnv) {
                    _this.canvasCache[filename] = cnv;
                    if (!_this.surfaceTree[n]) {
                        _this.surfaceTree[n] = {
                            base: _this.canvasCache[filename],
                            elements: [],
                            collisions: [],
                            animations: []
                        };
                    }
                    else {
                        _this.surfaceTree[n].base = _this.canvasCache[filename];
                    }
                }).catch(function (err) {
                    console.warn("Shell#loadSurfacePNG > " + err);
                    return Promise.resolve();
                });
            });
            return Promise.all(prms).then(function () { return Promise.resolve(_this); });
        };
        // load elements
        Shell.prototype.loadElements = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                var srfs = _this.surfaces.surfaces;
                Object.keys(srfs).filter(function (name) { return !!srfs[name].elements; }).forEach(function (defname) {
                    var n = srfs[defname].is;
                    var elms = srfs[defname].elements;
                    Object.keys(elms).forEach(function (elmname) {
                        var _a = elms[elmname], is = _a.is, type = _a.type, file = _a.file, x = _a.x, y = _a.y;
                        _this.getPNGFromDirectory(file).then(function (canvas) {
                            if (!_this.surfaceTree[n]) {
                                _this.surfaceTree[n] = {
                                    base: cuttlebone.SurfaceUtil.createCanvas(),
                                    elements: [],
                                    collisions: [],
                                    animations: []
                                };
                            }
                            _this.surfaceTree[n].elements[is] = { type: type, canvas: canvas, x: x, y: y };
                            resolve(Promise.resolve(_this));
                        }).catch(function (err) {
                            console.warn("Shell#loadElements > " + err);
                            resolve(Promise.resolve(_this));
                        });
                    });
                });
            });
        };
        // load collisions
        Shell.prototype.loadCollisions = function () {
            var _this = this;
            var srfs = this.surfaces.surfaces;
            Object.keys(srfs).filter(function (name) { return !!srfs[name].regions; }).forEach(function (defname) {
                var n = srfs[defname].is;
                var regions = srfs[defname].regions;
                Object.keys(regions).forEach(function (regname) {
                    if (!_this.surfaceTree[n]) {
                        _this.surfaceTree[n] = {
                            base: cuttlebone.SurfaceUtil.createCanvas(),
                            elements: [],
                            collisions: [],
                            animations: []
                        };
                    }
                    var is = regions[regname].is;
                    _this.surfaceTree[n].collisions[is] = regions[regname];
                });
            });
            return Promise.resolve(this);
        };
        // load animations
        Shell.prototype.loadAnimations = function () {
            var _this = this;
            var srfs = this.surfaces.surfaces;
            Object.keys(srfs).filter(function (name) { return !!srfs[name].animations; }).forEach(function (defname) {
                var n = srfs[defname].is;
                var animations = srfs[defname].animations;
                Object.keys(animations).forEach(function (animname) {
                    if (!_this.surfaceTree[n]) {
                        _this.surfaceTree[n] = {
                            base: cuttlebone.SurfaceUtil.createCanvas(),
                            elements: [],
                            collisions: [],
                            animations: []
                        };
                    }
                    var is = animations[animname].is;
                    _this.surfaceTree[n].animations[is] = animations[animname];
                });
            });
            return Promise.resolve(this);
        };
        Shell.prototype.hasFile = function (filename) {
            return find(Object.keys(this.directory), filename).length > 0;
        };
        Shell.prototype.getPNGFromDirectory = function (filename) {
            var _this = this;
            var hits = find(Object.keys(this.canvasCache), filename);
            if (hits.length > 0) {
                return Promise.resolve(this.canvasCache[hits[0]]);
            }
            var render = new cuttlebone.SurfaceRender(document.createElement("canvas"));
            return cuttlebone.SurfaceUtil.fetchImageFromArrayBuffer(this.directory[find(Object.keys(this.directory), filename)[0]]).then(function (img) {
                render.init(img);
                var pnafilename = filename.replace(/\.png$/i, ".pna");
                var hits = find(Object.keys(_this.directory), pnafilename);
                if (hits.length === 0) {
                    render.chromakey();
                    return Promise.resolve(render.cnv);
                }
                return cuttlebone.SurfaceUtil.fetchImageFromArrayBuffer(_this.directory[hits[0]]).then(function (pnaimg) {
                    render.pna(cuttlebone.SurfaceUtil.copy(pnaimg));
                    return Promise.resolve(render.cnv);
                });
            }).catch(function (err) {
                return Promise.reject("getPNGFromDirectory(" + filename + ") > " + err);
            });
        };
        Shell.prototype.attachSurface = function (canvas, scopeId, surfaceId) {
            var type = cuttlebone.SurfaceUtil.scope(scopeId);
            if (typeof surfaceId === "string") {
                if (!!this.surfaces.aliases && !!this.surfaces.aliases[type] && !!this.surfaces.aliases[type][surfaceId]) {
                    var _surfaceId = cuttlebone.SurfaceUtil.choice(this.surfaces.aliases[type][surfaceId]);
                }
                else {
                    throw new Error("RuntimeError: surface alias scope:" + type + ", id:" + surfaceId + " is not defined.");
                }
            }
            else if (typeof surfaceId === "number") {
                var _surfaceId = surfaceId;
            }
            else
                throw new Error("TypeError: surfaceId: number|string is not match " + typeof surfaceId);
            return new cuttlebone.Surface(canvas, scopeId, _surfaceId, this);
        };
        return Shell;
    })();
    cuttlebone.Shell = Shell;
})(cuttlebone || (cuttlebone = {}));
