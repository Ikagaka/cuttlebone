/// <reference path="./Surface"/>
/// <reference path="./SurfaceUtil"/>
/// <reference path="./SurfaceRender"/>
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
            this.surfaces = [];
            this.surfacesTxt = {};
            this.surfaceTree = [];
            this.canvasCache = {};
            this.bindgroup = [];
            this.isRegionVisible = false;
        }
        Shell.prototype.load = function () {
            var _this = this;
            return Promise.resolve(this)
                .then(function () { return _this.loadDescript(); }) // 1st
                .then(function () { return _this.loadBindGroup(); }) // 2nd
                .then(function () { return _this.loadSurfacesTxt(); }) // 1st
                .then(function () { return _this.loadSurfaceTable(); }) // 1st
                .then(function () { return _this.loadSurfacePNG(); }) // 2nd
                .then(function () { return _this.loadCollisions(); }) // 3rd
                .then(function () { return _this.loadAnimations(); }) // 3rd
                .then(function () { return _this.loadElements(); }) // 3rd
                .catch(function (err) {
                console.error("Shell#load > ", err);
                return Promise.reject(err);
            });
        };
        // load descript
        Shell.prototype.loadDescript = function () {
            var descript_name = Object.keys(this.directory).filter(function (name) { return /^descript\.txt$/i.test(name); })[0] || "";
            if (descript_name === "") {
                console.warn("descript.txt is not found");
            }
            else {
                this.descript = parseDescript(convert(this.directory[descript_name]));
            }
            return Promise.resolve(this);
        };
        Shell.prototype.loadBindGroup = function () {
            var _this = this;
            // load bindgroup
            var reg = /^(sakura|kero|char\d+)\.bindgroup(\d+)\.default/;
            Object.keys(this.descript).filter(function (key) { return reg.test(key); }).forEach(function (key) {
                var _a = reg.exec(key), _ = _a[0], charId = _a[1], bindgroupId = _a[2], type = _a[3];
                _this.bindgroup[Number(bindgroupId)] = _this.descript[key] === "1";
            });
            return Promise.resolve(this);
        };
        // load surfaces.txt
        Shell.prototype.loadSurfacesTxt = function () {
            var _this = this;
            var surfaces_text_names = Object.keys(this.directory).filter(function (name) { return /^surfaces.*\.txt$|^alias\.txt$/i.test(name); });
            if (surfaces_text_names.length === 0) {
                console.info("surfaces.txt is not found");
            }
            else {
                surfaces_text_names.forEach(function (filename) {
                    var srfs = SurfacesTxt2Yaml.txt_to_data(convert(_this.directory[filename]), { compatible: 'ssp-lazy' });
                    extend(_this.surfacesTxt, srfs);
                });
                //{ expand inherit and remove
                Object.keys(this.surfacesTxt.surfaces).forEach(function (name) {
                    if (typeof _this.surfacesTxt.surfaces[name].is === "number"
                        && Array.isArray(_this.surfacesTxt.surfaces[name].base)) {
                        _this.surfacesTxt.surfaces[name].base.forEach(function (key) {
                            extend(_this.surfacesTxt.surfaces[name], _this.surfacesTxt.surfaces[key]);
                        });
                        delete _this.surfacesTxt.surfaces[name].base;
                    }
                });
                Object.keys(this.surfacesTxt.surfaces).forEach(function (name) {
                    if (typeof _this.surfacesTxt.surfaces[name].is === "undefined") {
                        delete _this.surfacesTxt.surfaces[name];
                    }
                });
            }
            return Promise.resolve(this);
        };
        // load surfacetable.txt
        Shell.prototype.loadSurfaceTable = function () {
            var surfacetable_name = Object.keys(this.directory).filter(function (name) { return /^surfacetable.*\.txt$/i.test(name); })[0] || "";
            if (surfacetable_name === "") {
                console.info("surfacetable.txt is not found.");
            }
            else {
                var txt = convert(this.directory[surfacetable_name]);
            }
            return Promise.resolve(this);
        };
        // load surface*.png and surface*.pna
        Shell.prototype.loadSurfacePNG = function () {
            var _this = this;
            var surface_names = Object.keys(this.directory).filter(function (filename) { return /^surface(\d+)\.png$/i.test(filename); });
            var prms = surface_names.map(function (filename) {
                var n = Number(/^surface(\d+)\.png$/i.exec(filename)[1]);
                _this.getPNGFromDirectory(filename).then(function (cnv) {
                    if (!_this.surfaceTree[n]) {
                        _this.surfaceTree[n] = {
                            base: cnv,
                            elements: [],
                            collisions: [],
                            animations: []
                        };
                    }
                    else {
                        _this.surfaceTree[n].base = cnv;
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
                var srfs = _this.surfacesTxt.surfaces;
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
            var srfs = this.surfacesTxt.surfaces;
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
            var srfs = this.surfacesTxt.surfaces;
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
                    var _a = animations[animname], is = _a.is, interval = _a.interval;
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
            var cached_filename = find(Object.keys(this.canvasCache), filename)[0] || "";
            if (cached_filename !== "") {
                return Promise.resolve(this.canvasCache[cached_filename]);
            }
            if (!this.hasFile(filename)) {
                filename += ".png";
                if (!this.hasFile(filename)) {
                    throw new Error("no such file in directory: " + filename.replace(/\.png$/i, ""));
                }
                console.warn("element file " + filename + " need '.png' extension");
            }
            var render = new cuttlebone.SurfaceRender(document.createElement("canvas"));
            var _filename = find(Object.keys(this.directory), filename)[0];
            return cuttlebone.SurfaceUtil.fetchImageFromArrayBuffer(this.directory[_filename]).then(function (img) {
                render.init(img);
                var pnafilename = _filename.replace(/\.png$/i, ".pna");
                var _pnafilename = find(Object.keys(_this.directory), pnafilename)[0] || "";
                if (_pnafilename === "") {
                    render.chromakey();
                    _this.canvasCache[_filename] = render.cnv;
                    return Promise.resolve(render.cnv);
                }
                return cuttlebone.SurfaceUtil.fetchImageFromArrayBuffer(_this.directory[_pnafilename]).then(function (pnaimg) {
                    render.pna(cuttlebone.SurfaceUtil.copy(pnaimg));
                    _this.canvasCache[_filename] = render.cnv;
                    return Promise.resolve(render.cnv);
                });
            }).catch(function (err) {
                return Promise.reject("getPNGFromDirectory(" + filename + ") > " + err);
            });
        };
        Shell.prototype.attachSurface = function (canvas, scopeId, surfaceId) {
            var type = cuttlebone.SurfaceUtil.scope(scopeId);
            if (typeof surfaceId === "string") {
                if (!!this.surfacesTxt.aliases && !!this.surfacesTxt.aliases[type] && !!this.surfacesTxt.aliases[type][surfaceId]) {
                    var _surfaceId = cuttlebone.SurfaceUtil.choice(this.surfacesTxt.aliases[type][surfaceId]);
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
            var srf = new cuttlebone.Surface(canvas, scopeId, _surfaceId, this);
            this.surfaces.push([canvas, srf]);
            return srf;
        };
        Shell.prototype.detachSurface = function (canvas) {
            var tuple = this.surfaces.filter(function (tuple) { return tuple[0] === canvas; })[0];
            if (!tuple)
                return;
            tuple[1].destructor();
            this.surfaces.splice(this.surfaces.indexOf(tuple), 1);
        };
        Shell.prototype.hasSurface = function (scopeId, surfaceId) {
            var type = cuttlebone.SurfaceUtil.scope(scopeId);
            if (typeof surfaceId === "string") {
                if (!!this.surfacesTxt.aliases && !!this.surfacesTxt.aliases[type] && !!this.surfacesTxt.aliases[type][surfaceId]) {
                    var _surfaceId = cuttlebone.SurfaceUtil.choice(this.surfacesTxt.aliases[type][surfaceId]);
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
            return this.surfaceTree[_surfaceId] != null;
        };
        Shell.prototype.bind = function (animationId) {
            this.bindgroup[animationId] = true;
            this.surfaces.forEach(function (tuple) {
                var _ = tuple[0], srf = tuple[1];
                srf.updateBind();
            });
        };
        Shell.prototype.unbind = function (animationId) {
            this.bindgroup[animationId] = false;
            this.surfaces.forEach(function (tuple) {
                var _ = tuple[0], srf = tuple[1];
                srf.updateBind();
            });
        };
        Shell.prototype.render = function () {
            this.surfaces.forEach(function (tuple) {
                var _ = tuple[0], srf = tuple[1];
                srf.render();
            });
        };
        return Shell;
    })();
    cuttlebone.Shell = Shell;
})(cuttlebone || (cuttlebone = {}));
