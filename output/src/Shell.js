/// <!--reference path="Surface.ts"/-->
/// <reference path="SurfaceUtil.ts"/>
/// <reference path="SurfaceRender.ts"/>
/// <reference path="../tsd/SurfacesTxt2Yaml/SurfacesTxt2Yaml.d.ts"/>
/// <reference path="../tsd/encoding-japanese/encoding.d.ts"/>
/// <reference path="../typings/zepto/zepto.d.ts"/>
var cuttlebone;
(function (cuttlebone) {
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
    var Shell = (function () {
        function Shell(directory) {
            this.directory = directory;
            this.descript = {};
            this.surfaceTree = {};
            this.surfaces = {};
        }
        Shell.prototype.load = function () {
            var _this = this;
            var descript_name = Object.keys(this.directory).filter(function (name) { return /^descript\.txt$/i.test(name); })[0] || "";
            if (descript_name) {
                this.descript = parseDescript(convert(this.directory[descript_name]));
            }
            else {
                console.warn("descript.txt is not found");
            }
            var surfaces_text_names = Object.keys(this.directory).filter(function (name) { return /surfaces.*\.txt$/.test(name); });
            if (surfaces_text_names.length === 0) {
                console.warn("surfaces.txt is not found");
            }
            else {
                surfaces_text_names.forEach((function (filename) {
                    var _srfs = SurfacesTxt2Yaml.txt_to_data(convert(_this.directory[filename]), { compatible: 'ssp-lazy' });
                    $.extend(true, _this.surfaces, _srfs);
                }), {});
            }
            var surface_names = Object.keys(this.directory).filter(function (filename) { return /^surface(\d+)\.png$/i.test(filename); });
            var prms = surface_names.map(function (filename) {
                var n = Number(/^surface(\d+)\.png$/i.exec(filename)[1]);
                return new Promise(function (resolve, reject) {
                    cuttlebone.SurfaceUtil.fetchImageFromArrayBuffer(_this.directory[filename]).then(function (img) {
                        var render = new cuttlebone.SurfaceRender(cuttlebone.SurfaceUtil.copy(img));
                        _this.surfaceTree[n] = {
                            base: render.cnv,
                            elements: [],
                            collisions: [],
                            animations: []
                        };
                        var pnafilename = filename.replace(/\.png$/i, ".pna");
                        if (!_this.directory[pnafilename]) {
                            render.chromakey();
                            resolve(Promise.resolve(_this));
                        }
                        else {
                            cuttlebone.SurfaceUtil.fetchImageFromArrayBuffer(_this.directory[filename]).then(function (pnaimg) {
                                render.pna(cuttlebone.SurfaceUtil.copy(pnaimg));
                                resolve(Promise.resolve(_this));
                            });
                        }
                    });
                });
            });
            return Promise.all(prms).then(function () {
                // surfacesTxt reading
                return _this;
            });
        };
        return Shell;
    })();
    cuttlebone.Shell = Shell;
})(cuttlebone || (cuttlebone = {}));
